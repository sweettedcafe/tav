import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatCell } from "@/lib/format";

export default function AdminMockReviews() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [questions, setQuestions] = useState<Record<string, any>>({});
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [overall, setOverall] = useState("");

  const load = async () => {
    const { data } = await supabase.from("mock_interview_sessions").select("*").order("created_at", { ascending: false });
    setSessions(data ?? []);
    const ids = [...new Set((data ?? []).map((s) => s.user_id))];
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      setProfiles(Object.fromEntries((ps ?? []).map((p) => [p.id, p])));
    }
  };
  useEffect(() => { load(); }, []);

  const openSession = async (s: any) => {
    setActive(s); setOverall(s.overall_feedback ?? "");
    const { data: r } = await supabase.from("mock_interview_responses").select("*").eq("session_id", s.id).order("sort_order");
    setResponses(r ?? []);
    const qids = (r ?? []).map((x) => x.question_id);
    if (qids.length) {
      const { data: qs } = await supabase.from("interview_questions").select("*").in("id", qids);
      setQuestions(Object.fromEntries((qs ?? []).map((q) => [q.id, q])));
    }
  };

  const updateR = (rid: string, patch: any) => setResponses((cur) => cur.map((x) => x.id === rid ? { ...x, ...patch } : x));

  const saveAll = async () => {
    for (const r of responses) {
      await supabase.from("mock_interview_responses").update({
        admin_feedback: r.admin_feedback, admin_score: r.admin_score, reviewed_at: new Date().toISOString(),
      }).eq("id", r.id);
    }
    await supabase.from("mock_interview_sessions").update({
      overall_feedback: overall, status: "reviewed", reviewed_at: new Date().toISOString(),
    }).eq("id", active.id);
    toast.success("Review saved");
    load();
  };

  return (
    <div className="container-page py-10">
      <Helmet><title>Mock interview reviews — Admin</title></Helmet>
      <h1 className="font-display text-3xl md:text-4xl font-semibold mb-6">Mock interview reviews</h1>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-2">
          {sessions.map((s) => (
            <Card key={s.id} className={`cursor-pointer ${active?.id === s.id ? "ring-2 ring-primary" : ""}`} onClick={() => openSession(s)}>
              <CardContent className="p-3">
                <div className="font-medium text-sm">{profiles[s.user_id]?.full_name ?? profiles[s.user_id]?.email ?? "Learner"}</div>
                <div className="text-xs text-muted-foreground">{s.title} · {formatCell("created_at", s.created_at)}</div>
                <Badge variant={s.status === "reviewed" ? "default" : s.status === "submitted" ? "secondary" : "outline"} className="capitalize mt-1 text-xs">{s.status.replace("_"," ")}</Badge>
              </CardContent>
            </Card>
          ))}
          {sessions.length === 0 && <p className="text-sm text-muted-foreground">No sessions yet.</p>}
        </div>

        <div>
          {!active && <Card><CardContent className="py-16 text-center text-muted-foreground">Select a session to review.</CardContent></Card>}
          {active && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium">{profiles[active.user_id]?.full_name ?? profiles[active.user_id]?.email}</div>
                  <div className="text-xs text-muted-foreground mb-3">{active.title}</div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Overall feedback</label>
                  <Textarea rows={3} value={overall} onChange={(e) => setOverall(e.target.value)} placeholder="Overall observations and next steps…" />
                </CardContent>
              </Card>
              {responses.map((r, i) => {
                const q = questions[r.question_id]; if (!q) return null;
                return (
                  <Card key={r.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2"><span className="text-xs font-semibold text-muted-foreground">Q{i+1}</span><Badge variant="secondary" className="capitalize">{q.category}</Badge></div>
                      <div className="font-medium">{q.title}</div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{q.prompt}</p>
                      <div>
                        <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Learner answer</label>
                        <pre className="text-sm bg-muted p-3 rounded whitespace-pre-wrap font-mono">{r.answer || <span className="text-muted-foreground">No answer.</span>}</pre>
                      </div>
                      <div className="grid sm:grid-cols-[1fr_120px] gap-2 items-end">
                        <div>
                          <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Your feedback</label>
                          <Textarea rows={3} value={r.admin_feedback ?? ""} onChange={(e) => updateR(r.id, { admin_feedback: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Score /5</label>
                          <Input type="number" min={0} max={5} value={r.admin_score ?? ""} onChange={(e) => updateR(r.id, { admin_score: e.target.value ? Number(e.target.value) : null })} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              <div className="flex gap-2">
                <Button onClick={saveAll}>Save review & mark reviewed</Button>
                <Button variant="outline" asChild><Link to={`/mock-interview/${active.id}`}>Open learner view</Link></Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
