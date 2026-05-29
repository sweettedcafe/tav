import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ShieldCheck, ShieldOff, Search, ExternalLink, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type Learner = {
  id: string;
  full_name: string | null;
  email: string | null;
  handle: string | null;
  created_at: string;
  is_admin: boolean;
  lessons_done: number;
  exercises_correct: number;
  projects_approved: number;
  has_certificate: boolean;
};

export default function AdminLearners() {
  const { user } = useAuth();
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Learner | null>(null);
  const [detailData, setDetailData] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }, { data: lp }, { data: es }, { data: ps }, { data: certs }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("lesson_progress").select("user_id"),
      supabase.from("exercise_submissions").select("user_id, is_correct"),
      supabase.from("project_submissions").select("user_id, status"),
      supabase.from("certificates").select("user_id, revoked_at"),
    ]);

    const adminIds = new Set((roles ?? []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id));
    const lessonsByUser = new Map<string, number>();
    (lp ?? []).forEach((r: any) => lessonsByUser.set(r.user_id, (lessonsByUser.get(r.user_id) ?? 0) + 1));
    const correctByUser = new Map<string, number>();
    (es ?? []).filter((r: any) => r.is_correct).forEach((r: any) => correctByUser.set(r.user_id, (correctByUser.get(r.user_id) ?? 0) + 1));
    const approvedByUser = new Map<string, number>();
    (ps ?? []).filter((r: any) => r.status === "approved").forEach((r: any) => approvedByUser.set(r.user_id, (approvedByUser.get(r.user_id) ?? 0) + 1));
    const certByUser = new Set((certs ?? []).filter((c: any) => !c.revoked_at).map((c: any) => c.user_id));

    setLearners((profiles ?? []).map((p: any) => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      handle: p.handle,
      created_at: p.created_at,
      is_admin: adminIds.has(p.id),
      lessons_done: lessonsByUser.get(p.id) ?? 0,
      exercises_correct: correctByUser.get(p.id) ?? 0,
      projects_approved: approvedByUser.get(p.id) ?? 0,
      has_certificate: certByUser.has(p.id),
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleAdmin = async (l: Learner) => {
    if (l.id === user?.id && l.is_admin) {
      if (!confirm("Remove admin role from yourself? You'll lose access to admin pages.")) return;
    }
    if (l.is_admin) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", l.id).eq("role", "admin");
      if (error) return toast.error(error.message);
      toast.success("Admin access removed");
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: l.id, role: "admin" });
      if (error) return toast.error(error.message);
      toast.success("Promoted to admin");
    }
    load();
  };

  const openDetail = async (l: Learner) => {
    setDetail(l);
    setDetailData(null);
    const [{ data: subs }, { data: attempts }, { data: progress }] = await Promise.all([
      supabase.from("project_submissions").select("*, projects(title, slug)").eq("user_id", l.id).order("updated_at", { ascending: false }),
      supabase.from("quiz_attempts").select("*, quizzes(title)").eq("user_id", l.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("lesson_progress").select("*, lessons(title)").eq("user_id", l.id).order("completed_at", { ascending: false }).limit(20),
    ]);
    setDetailData({ subs: subs ?? [], attempts: attempts ?? [], progress: progress ?? [] });
  };

  const filtered = learners.filter((l) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return [l.full_name, l.email, l.handle].some((v) => v?.toLowerCase().includes(q));
  });

  return (
    <div className="container-page py-10">
      <Helmet><title>Learners — Admin</title></Helmet>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">Learners</h1>
          <p className="text-muted-foreground">Progress, scores, and outputs for every learner.</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, email, handle" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">No learners match your search.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-medium">Learner</th>
                    <th className="px-4 py-3 font-medium">Lessons</th>
                    <th className="px-4 py-3 font-medium">Exercises</th>
                    <th className="px-4 py-3 font-medium">Projects</th>
                    <th className="px-4 py-3 font-medium">Cert</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr key={l.id} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">{l.full_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{l.email}</div>
                      </td>
                      <td className="px-4 py-3 font-mono">{l.lessons_done}</td>
                      <td className="px-4 py-3 font-mono">{l.exercises_correct}</td>
                      <td className="px-4 py-3 font-mono">{l.projects_approved}</td>
                      <td className="px-4 py-3">{l.has_certificate ? <Badge>Issued</Badge> : <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-4 py-3">{l.is_admin ? <Badge variant="default">Admin</Badge> : <Badge variant="secondary">Learner</Badge>}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" onClick={() => openDetail(l)}><UserIcon className="h-4 w-4" /></Button>
                        {l.handle && (
                          <Button variant="ghost" size="sm" asChild><Link to={`/p/${l.handle}`} target="_blank"><ExternalLink className="h-4 w-4" /></Link></Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => toggleAdmin(l)} title={l.is_admin ? "Revoke admin" : "Make admin"}>
                          {l.is_admin ? <ShieldOff className="h-4 w-4 text-destructive" /> : <ShieldCheck className="h-4 w-4" />}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{detail?.full_name || detail?.email}</DialogTitle></DialogHeader>
          {!detailData ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
            <div className="space-y-6 text-sm">
              <section>
                <h3 className="font-semibold mb-2">Project submissions ({detailData.subs.length})</h3>
                {detailData.subs.length === 0 ? <p className="text-muted-foreground">None yet.</p> : (
                  <ul className="space-y-2">
                    {detailData.subs.map((s: any) => (
                      <li key={s.id} className="flex items-center justify-between border rounded p-2">
                        <div>
                          <div className="font-medium">{s.title || s.projects?.title}</div>
                          <div className="text-xs text-muted-foreground">{new Date(s.updated_at).toLocaleString()}</div>
                        </div>
                        <Badge variant={s.status === "approved" ? "default" : "secondary"}>{s.status.replace("_", " ")}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section>
                <h3 className="font-semibold mb-2">Recent quiz attempts ({detailData.attempts.length})</h3>
                {detailData.attempts.length === 0 ? <p className="text-muted-foreground">No attempts.</p> : (
                  <ul className="space-y-1">
                    {detailData.attempts.map((a: any) => (
                      <li key={a.id} className="flex justify-between border-b pb-1">
                        <span>{a.quizzes?.title || "Quiz"}</span>
                        <span className={a.passed ? "text-success font-medium" : "text-muted-foreground"}>{a.score}%</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section>
                <h3 className="font-semibold mb-2">Recent lesson completions</h3>
                {detailData.progress.length === 0 ? <p className="text-muted-foreground">No lessons completed yet.</p> : (
                  <ul className="space-y-1 text-muted-foreground">
                    {detailData.progress.map((p: any) => <li key={p.id}>✓ {p.lessons?.title}</li>)}
                  </ul>
                )}
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
