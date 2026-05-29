import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ArrowLeft, Save, Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { formatCell } from "@/lib/format";

export function MockInterviewList() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [focus, setFocus] = useState("sql");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("mock_interview_sessions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setSessions(data ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const create = async () => {
    if (!user) return;
    setCreating(true);
    // pick 5 random questions matching focus
    let query = supabase.from("interview_questions").select("id").eq("is_published", true);
    if (focus !== "mixed") query = query.eq("category", focus);
    const { data: qs } = await query.limit(50);
    const pool = (qs ?? []).sort(() => Math.random() - 0.5).slice(0, 5);
    if (pool.length === 0) { toast.error("No questions available for that focus."); setCreating(false); return; }
    const { data: sess, error } = await supabase.from("mock_interview_sessions").insert({
      user_id: user.id, title: title || "Mock Interview", focus,
    }).select().single();
    if (error || !sess) { toast.error(error?.message ?? "Failed"); setCreating(false); return; }
    await supabase.from("mock_interview_responses").insert(pool.map((p, i) => ({
      session_id: sess.id, question_id: p.id, user_id: user.id, sort_order: i,
    })));
    setCreating(false);
    navigate(`/mock-interview/${sess.id}`);
  };

  return (
    <div className="container-page py-10 max-w-4xl">
      <Helmet><title>Mock interviews — The Analytics Vanguard</title></Helmet>
      <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">Mock interviews</h1>
      <p className="text-muted-foreground mb-6">Run a timed practice round, save your answers, and submit for mentor feedback.</p>

      <Card className="mb-8">
        <CardContent className="p-5 space-y-3">
          <h2 className="font-display font-semibold text-lg">Start a new session</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <Input placeholder="Session title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} className="sm:col-span-2" />
            <Select value={focus} onValueChange={setFocus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sql">SQL only</SelectItem>
                <SelectItem value="python">Python only</SelectItem>
                <SelectItem value="statistics">Statistics</SelectItem>
                <SelectItem value="case">Case</SelectItem>
                <SelectItem value="behavioral">Behavioral</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={create} disabled={creating}><Plus className="h-4 w-4 mr-2" /> Start mock interview (5 questions)</Button>
        </CardContent>
      </Card>

      <h2 className="font-display font-semibold text-lg mb-3">Your past sessions</h2>
      <div className="space-y-2">
        {sessions.map((s) => (
          <Link key={s.id} to={`/mock-interview/${s.id}`}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{formatCell("created_at", s.created_at)} · focus: {s.focus}</div>
                </div>
                <Badge variant={s.status === "reviewed" ? "default" : s.status === "submitted" ? "secondary" : "outline"} className="capitalize">{s.status.replace("_", " ")}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
        {sessions.length === 0 && <p className="text-sm text-muted-foreground">No sessions yet.</p>}
      </div>
    </div>
  );
}

export function MockInterviewSession() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [questions, setQuestions] = useState<Record<string, any>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const load = async () => {
    if (!id) return;
    const { data: s } = await supabase.from("mock_interview_sessions").select("*").eq("id", id).maybeSingle();
    setSession(s);
    const { data: r } = await supabase.from("mock_interview_responses").select("*").eq("session_id", id).order("sort_order");
    setResponses(r ?? []);
    const ids = (r ?? []).map((x) => x.question_id);
    if (ids.length) {
      const { data: qs } = await supabase.from("interview_questions").select("*").in("id", ids);
      setQuestions(Object.fromEntries((qs ?? []).map((q) => [q.id, q])));
    }
  };
  useEffect(() => { load(); }, [id]);

  const updateResponse = (rid: string, patch: any) => setResponses((cur) => cur.map((x) => x.id === rid ? { ...x, ...patch } : x));

  const saveAll = async () => {
    for (const r of responses) {
      await supabase.from("mock_interview_responses").update({ answer: r.answer, self_rating: r.self_rating }).eq("id", r.id);
    }
    toast.success("Answers saved");
  };

  const submit = async () => {
    await saveAll();
    await supabase.from("mock_interview_sessions").update({ status: "submitted" }).eq("id", id!);
    toast.success("Submitted for mentor review");
    load();
  };

  if (!session) return <div className="container-page py-10">Loading…</div>;

  const isOwner = user?.id === session.user_id;
  const editable = isOwner && session.status === "in_progress";

  return (
    <div className="container-page py-10 max-w-4xl">
      <Helmet><title>{session.title} — Mock interview</title></Helmet>
      <Button variant="ghost" size="sm" asChild className="mb-4"><Link to="/mock-interview"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Link></Button>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">{session.title}</h1>
          <p className="text-sm text-muted-foreground capitalize">Focus: {session.focus} · Status: {session.status.replace("_"," ")}</p>
        </div>
        {editable && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveAll}><Save className="h-4 w-4 mr-2" /> Save</Button>
            <Button onClick={submit}><Send className="h-4 w-4 mr-2" /> Submit for review</Button>
          </div>
        )}
      </div>

      {session.overall_feedback && (
        <Card className="mb-6 border-accent">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider font-semibold text-accent mb-1 flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5" /> Mentor overall feedback</div>
            <p className="text-sm whitespace-pre-wrap">{session.overall_feedback}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {responses.map((r, i) => {
          const q = questions[r.question_id];
          if (!q) return null;
          return (
            <Card key={r.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-muted-foreground">Q{i + 1}</span>
                  <Badge variant="secondary" className="capitalize">{q.category}</Badge>
                  <Badge variant="outline" className="capitalize">{q.difficulty}</Badge>
                </div>
                <h3 className="font-display font-semibold text-lg">{q.title}</h3>
                <p className="text-sm whitespace-pre-wrap">{q.prompt}</p>
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Your answer</label>
                  <Textarea rows={6} value={r.answer ?? ""} disabled={!editable} onChange={(e) => updateResponse(r.id, { answer: e.target.value })} placeholder={editable ? "Write your answer here…" : "No answer."} className="font-mono text-sm" />
                </div>
                {editable && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Self-rating (1-5):</span>
                    <Input type="number" min={1} max={5} value={r.self_rating ?? ""} onChange={(e) => updateResponse(r.id, { self_rating: e.target.value ? Number(e.target.value) : null })} className="w-20" />
                  </div>
                )}
                {!editable && r.self_rating != null && <div className="text-xs text-muted-foreground">Self-rating: {r.self_rating}/5</div>}
                {(r.admin_feedback || r.admin_score != null) && (
                  <div className="border-l-2 border-accent pl-3 bg-accent/5 p-3 rounded">
                    <div className="text-xs uppercase tracking-wider font-semibold text-accent mb-1">Mentor feedback {r.admin_score != null && `· ${r.admin_score}/5`}</div>
                    <p className="text-sm whitespace-pre-wrap">{r.admin_feedback}</p>
                  </div>
                )}
                {!editable && (
                  <Button variant="ghost" size="sm" onClick={() => setRevealed({ ...revealed, [r.id]: !revealed[r.id] })}>
                    {revealed[r.id] ? "Hide sample answer" : "Show sample answer"}
                  </Button>
                )}
                {revealed[r.id] && q.sample_answer && (
                  <pre className="text-xs bg-primary text-primary-foreground p-3 rounded overflow-x-auto whitespace-pre-wrap font-mono">{q.sample_answer}</pre>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isAdmin && <p className="text-xs text-muted-foreground mt-6 text-center">Tip: leave per-question feedback from the admin Mock Reviews queue.</p>}
    </div>
  );
}
