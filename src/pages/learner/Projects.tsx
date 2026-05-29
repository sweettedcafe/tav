import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-100 text-blue-700",
  under_review: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  needs_revision: "bg-red-100 text-red-700",
};

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [subs, setSubs] = useState<Record<string, any>>({});
  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("projects").select("*").eq("is_published", true);
      setProjects(p ?? []);
      if (user) {
        const { data: s } = await supabase.from("project_submissions").select("*").eq("user_id", user.id);
        setSubs(Object.fromEntries((s ?? []).map((x: any) => [x.project_id, x])));
      }
    })();
  }, [user]);

  return (
    <div className="container-page py-10">
      <Helmet><title>Projects — The Analytics Vanguard</title></Helmet>
      <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">Capstone projects</h1>
      <p className="text-muted-foreground mb-8">Build deliverables that go straight onto your portfolio.</p>
      {projects.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">No projects yet — your admin will publish briefs shortly.</CardContent></Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((p) => {
            const s = subs[p.id];
            return (
              <Card key={p.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-display text-xl font-semibold">{p.title}</h3>
                    {s && <Badge className={statusColor[s.status]}>{s.status.replace("_", " ")}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{p.scenario}</p>
                  <Button size="sm" asChild><Link to={`/projects/${p.slug}`}>{s ? "Continue" : "Open brief"}</Link></Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
