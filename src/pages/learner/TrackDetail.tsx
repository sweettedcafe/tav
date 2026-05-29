import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function TrackDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [track, setTrack] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: t } = await supabase.from("tracks").select("*").eq("slug", slug).maybeSingle();
      if (!t) return;
      setTrack(t);
      const { data: ms } = await supabase.from("modules").select("*, lessons(id, title, slug, sort_order)").eq("track_id", t.id).eq("is_published", true).order("sort_order");
      setModules(ms ?? []);
      if (user) {
        const { data: prog } = await supabase.from("lesson_progress").select("lesson_id").eq("user_id", user.id);
        setCompletedIds(new Set((prog ?? []).map((p) => p.lesson_id)));
      }
    })();
  }, [slug, user]);

  if (!track) return <div className="container-page py-10">Loading…</div>;

  return (
    <div className="container-page py-10">
      <Helmet><title>{track.title} — The Analytics Vanguard</title></Helmet>
      <Button variant="ghost" size="sm" asChild className="mb-4"><Link to="/tracks"><ArrowLeft className="h-4 w-4 mr-2" /> All tracks</Link></Button>
      <div className="mb-8">
        <Badge variant="secondary" className="capitalize">{track.level}</Badge>
        <h1 className="font-display text-3xl md:text-4xl font-semibold mt-3">{track.title}</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">{track.description}</p>
      </div>
      <div className="space-y-6">
        {modules.map((m, i) => (
          <Card key={m.id}>
            <CardContent className="p-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="font-mono text-xs text-muted-foreground">Module {i + 1}</span>
                <h2 className="font-display text-xl font-semibold">{m.title}</h2>
              </div>
              {m.summary && <p className="text-sm text-muted-foreground mb-4">{m.summary}</p>}
              <ul className="divide-y border rounded-md">
                {(m.lessons ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((l: any) => (
                  <li key={l.id}>
                    <Link to={`/tracks/${slug}/lessons/${l.id}`} className="flex items-center justify-between gap-3 p-3 hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        {completedIds.has(l.id) ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                        <span className="text-sm">{l.title}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
                {(m.lessons ?? []).length === 0 && <li className="p-3 text-sm text-muted-foreground">No lessons yet.</li>}
              </ul>
            </CardContent>
          </Card>
        ))}
        {modules.length === 0 && <p className="text-muted-foreground">No modules yet.</p>}
      </div>
    </div>
  );
}
