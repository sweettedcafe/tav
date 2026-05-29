import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

export default function ProjectDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [sub, setSub] = useState<any>({ title: "", writeup: "", code: "", dashboard_url: "", github_repo_url: "" });
  const [existing, setExisting] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: p } = await supabase.from("projects").select("*").eq("slug", slug).maybeSingle();
      setProject(p);
      if (p && user) {
        const { data: s } = await supabase.from("project_submissions").select("*").eq("user_id", user.id).eq("project_id", p.id).maybeSingle();
        if (s) { setExisting(s); setSub({ title: s.title ?? "", writeup: s.writeup ?? "", code: s.code ?? "", dashboard_url: s.dashboard_url ?? "", github_repo_url: s.github_repo_url ?? "" }); }
      }
    })();
  }, [slug, user]);

  const save = async (status: "draft" | "submitted") => {
    if (!project || !user) return;
    setSaving(true);
    const payload = { ...sub, project_id: project.id, user_id: user.id, status };
    const { error } = existing
      ? await supabase.from("project_submissions").update(payload).eq("id", existing.id)
      : await supabase.from("project_submissions").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "submitted" ? "Submitted for review!" : "Draft saved.");
    const { data: s } = await supabase.from("project_submissions").select("*").eq("user_id", user.id).eq("project_id", project.id).maybeSingle();
    setExisting(s);
  };

  if (!project) return <div className="container-page py-10">Loading…</div>;
  const locked = existing && ["submitted", "under_review", "approved"].includes(existing.status);

  return (
    <div className="container-page py-10 max-w-4xl">
      <Helmet><title>{project.title} — Project</title></Helmet>
      <Button variant="ghost" size="sm" asChild className="mb-4"><Link to="/projects"><ArrowLeft className="h-4 w-4 mr-2" /> Projects</Link></Button>
      <Badge variant="secondary" className="capitalize">{project.difficulty}</Badge>
      <h1 className="font-display text-3xl md:text-4xl font-semibold mt-2 mb-6">{project.title}</h1>

      <Card className="mb-6"><CardContent className="p-6 prose prose-slate max-w-none">
        <h3>Scenario</h3>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{project.scenario}</ReactMarkdown>
        {project.deliverables && (<><h3>Deliverables</h3><ReactMarkdown remarkPlugins={[remarkGfm]}>{project.deliverables}</ReactMarkdown></>)}
      </CardContent></Card>

      <Card><CardContent className="p-6 space-y-4">
        <h3 className="font-display text-xl font-semibold">Your submission</h3>
        {existing && <Badge>{existing.status.replace("_", " ")}</Badge>}
        {existing?.feedback && (
          <div className="rounded-md border bg-muted p-4 text-sm">
            <div className="font-semibold mb-1">Mentor feedback{existing.score != null && ` — ${existing.score}/100`}</div>
            <p className="whitespace-pre-wrap">{existing.feedback}</p>
          </div>
        )}
        <div><Label>Project title</Label><Input value={sub.title} disabled={locked} onChange={(e) => setSub({ ...sub, title: e.target.value })} /></div>
        <div><Label>Write-up (Markdown)</Label><Textarea rows={10} value={sub.writeup} disabled={locked} onChange={(e) => setSub({ ...sub, writeup: e.target.value })} placeholder="Your analysis, findings, and methodology..." /></div>
        <div><Label>Code (SQL / Python)</Label><Textarea rows={8} value={sub.code} disabled={locked} className="font-mono text-xs" onChange={(e) => setSub({ ...sub, code: e.target.value })} /></div>
        <div><Label>Dashboard URL (optional)</Label><Input value={sub.dashboard_url} disabled={locked} onChange={(e) => setSub({ ...sub, dashboard_url: e.target.value })} placeholder="https://..." /></div>
        <div>
          <Label>GitHub repository (optional)</Label>
          <Input
            value={sub.github_repo_url}
            disabled={locked}
            onChange={(e) => setSub({ ...sub, github_repo_url: e.target.value })}
            placeholder="https://github.com/your-username/project-name"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Push your notebooks, SQL, and write-up to a public GitHub repo and paste the link here. New to GitHub?{" "}
            <a href="https://docs.github.com/en/get-started/quickstart/create-a-repo" target="_blank" rel="noreferrer" className="underline">Create a repo</a>.
          </p>
        </div>
        {!locked && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => save("draft")} disabled={saving}>Save draft</Button>
            <Button onClick={() => save("submitted")} disabled={saving}>Submit for review</Button>
          </div>
        )}
      </CardContent></Card>
    </div>
  );
}
