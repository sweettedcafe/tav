import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const STATUSES = ["submitted", "under_review", "needs_revision", "approved", "draft"] as const;
type Status = typeof STATUSES[number];

export default function AdminSubmissions() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Status>("submitted");
  const [open, setOpen] = useState<any | null>(null);
  const [form, setForm] = useState({ score: "", feedback: "", status: "under_review" as Status });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: alt } = await supabase.from("project_submissions").select("*, projects(title, slug)").order("updated_at", { ascending: false });
    const ids = Array.from(new Set((alt ?? []).map((s: any) => s.user_id)));
    const { data: profs } = ids.length ? await supabase.from("profiles").select("id, full_name, email, handle").in("id", ids) : { data: [] as any[] };
    const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
    setItems((alt ?? []).map((s: any) => ({ ...s, profiles: map.get(s.user_id) })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openReview = (s: any) => {
    setOpen(s);
    setForm({ score: s.score?.toString() ?? "", feedback: s.feedback ?? "", status: s.status });
  };

  const save = async () => {
    if (!open) return;
    setSaving(true);
    const { error } = await supabase.from("project_submissions").update({
      status: form.status,
      score: form.score === "" ? null : Number(form.score),
      feedback: form.feedback || null,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    }).eq("id", open.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Review saved");
    setOpen(null);
    load();
  };

  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: items.filter((i) => i.status === s).length }), {} as Record<Status, number>);
  const filtered = items.filter((s) => s.status === tab);

  return (
    <div className="container-page py-10">
      <Helmet><title>Submissions — Admin</title></Helmet>
      <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">Project submissions</h1>
      <p className="text-muted-foreground mb-6">Review, score, and give feedback against the rubric.</p>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
        <TabsList className="mb-4 flex-wrap h-auto">
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">{s.replace("_", " ")} <span className="ml-2 text-xs opacity-60">{counts[s] ?? 0}</span></TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab}>
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-muted-foreground" /></div>
              ) : filtered.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">No submissions in this stage.</div>
              ) : (
                <ul className="divide-y">
                  {filtered.map((s) => (
                    <li key={s.id} className="p-4 flex items-start justify-between gap-3 hover:bg-muted/30">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium">{s.title || s.projects?.title || "Untitled"}</span>
                          <Badge variant="secondary" className="capitalize">{s.status.replace("_", " ")}</Badge>
                          {s.score != null && <Badge>Score {s.score}</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {s.profiles?.full_name || s.profiles?.email || "Unknown learner"} · Updated {new Date(s.updated_at).toLocaleString()}
                        </div>
                      </div>
                      <Button size="sm" onClick={() => openReview(s)}>Review</Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{open?.title || open?.projects?.title}</DialogTitle></DialogHeader>
          {open && (
            <div className="space-y-5 text-sm">
              <div className="text-xs text-muted-foreground">
                By {open.profiles?.full_name || open.profiles?.email} · Project: {open.projects?.title}
              </div>

              {open.writeup && (
                <section>
                  <h4 className="font-semibold mb-1">Write-up</h4>
                  <div className="prose prose-slate max-w-none border rounded p-3 bg-muted/30 text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{open.writeup}</ReactMarkdown>
                  </div>
                </section>
              )}
              {open.code && (
                <section>
                  <h4 className="font-semibold mb-1">Code</h4>
                  <pre className="border rounded p-3 bg-muted/30 text-xs overflow-x-auto whitespace-pre-wrap font-mono">{open.code}</pre>
                </section>
              )}
              <div className="flex gap-3 flex-wrap">
                {open.dashboard_url && (
                  <a href={open.dashboard_url} target="_blank" rel="noreferrer" className="text-primary underline inline-flex items-center gap-1">Dashboard <ExternalLink className="h-3 w-3" /></a>
                )}
                {open.github_repo_url && (
                  <a href={open.github_repo_url} target="_blank" rel="noreferrer" className="text-primary underline inline-flex items-center gap-1">GitHub <ExternalLink className="h-3 w-3" /></a>
                )}
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Status</Label>
                    <select className="w-full mt-1 h-10 border rounded-md px-2 bg-background" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })}>
                      {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.replace("_", " ")}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Score (0-100)</Label>
                    <Input type="number" min={0} max={100} value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Feedback (visible to learner)</Label>
                  <Textarea rows={5} value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} placeholder="Strengths, areas to improve, next steps..." />
                </div>
                <Button onClick={save} disabled={saving} className="w-full">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save review
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
