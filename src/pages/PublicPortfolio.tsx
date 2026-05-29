import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function PublicPortfolio() {
  const { handle } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [cert, setCert] = useState<any>(null);

  useEffect(() => {
    if (!handle) return;
    (async () => {
      const { data: prof } = await supabase.from("profiles_public").select("*").eq("handle", handle).maybeSingle();
      if (!prof) return;
      setProfile(prof);
      const [{ data: subs }, { data: c }] = await Promise.all([
        supabase.from("project_submissions").select("*, projects(title, slug)").eq("user_id", prof.id).eq("status", "approved"),
        supabase.rpc("public_certificate_for_user", { _user_id: prof.id }).maybeSingle(),
      ]);
      setProjects(subs ?? []);
      setCert(c);
    })();
  }, [handle]);

  if (!profile) return <div className="container-page py-20 text-center text-muted-foreground">Profile not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Helmet><title>{profile.full_name} — Analytics Portfolio</title><meta name="description" content={profile.headline ?? `${profile.full_name}'s data analytics portfolio`} /></Helmet>
      <header className="gradient-hero text-primary-foreground">
        <div className="container-page py-16">
          <Link to="/" className="text-xs uppercase tracking-widest text-accent">The Analytics Vanguard</Link>
          <div className="mt-6 flex items-start gap-6 flex-wrap">
            {profile.avatar_url && <img src={profile.avatar_url} alt={profile.full_name} className="h-20 w-20 rounded-full border-2 border-primary-foreground/20 object-cover" />}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-4xl md:text-5xl font-semibold">{profile.full_name}</h1>
              {profile.headline && <p className="text-primary-foreground/80 mt-2 text-lg">{profile.headline}</p>}
              {cert && (
                <div className="mt-4 inline-flex items-center gap-2 bg-accent text-accent-foreground rounded-full px-3 py-1 text-sm font-medium">
                  <Award className="h-4 w-4" /> Certified Vanguard · {cert.certificate_code}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container-page py-12 grid gap-10 lg:grid-cols-[1fr_2fr]">
        <aside>
          <h2 className="font-display text-xl font-semibold mb-3">About</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.bio || "—"}</p>
        </aside>
        <section>
          <h2 className="font-display text-xl font-semibold mb-4">Approved projects</h2>
          {projects.length === 0 ? <p className="text-muted-foreground text-sm">No approved projects yet.</p> : (
            <div className="space-y-4">
              {projects.map((s) => (
                <Card key={s.id}><CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge variant="secondary">{s.projects?.title}</Badge>
                      <h3 className="font-display text-xl font-semibold mt-2">{s.title || s.projects?.title}</h3>
                    </div>
                    {s.score != null && <Badge>{s.score}/100</Badge>}
                  </div>
                  <article className="prose prose-slate max-w-none mt-3 prose-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{s.writeup ?? ""}</ReactMarkdown>
                  </article>
                  {s.dashboard_url && <Button variant="outline" size="sm" className="mt-3" asChild><a href={s.dashboard_url} target="_blank" rel="noreferrer">View dashboard <ExternalLink className="h-3 w-3 ml-2" /></a></Button>}
                </CardContent></Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
