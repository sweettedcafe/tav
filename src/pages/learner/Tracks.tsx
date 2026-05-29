import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";

export default function Tracks() {
  const [tracks, setTracks] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("tracks").select("*, modules(id)").eq("is_published", true).order("sort_order").then(({ data }) => setTracks(data ?? []));
  }, []);

  return (
    <div className="container-page py-10">
      <Helmet><title>Learning tracks — The Analytics Vanguard</title></Helmet>
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-semibold">Learning tracks</h1>
        <p className="text-muted-foreground mt-1">Beginner to advanced. Take them in any order — but follow the level for best results.</p>
      </div>

      {tracks.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
          No tracks yet. Your admin will publish them shortly.
        </CardContent></Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tracks.map((t) => (
            <Card key={t.id} className="overflow-hidden hover:shadow-elegant transition-shadow group">
              <div className="gradient-hero p-6 text-primary-foreground">
                <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground capitalize">{t.level}</Badge>
                <h3 className="font-display text-2xl font-semibold mt-3">{t.title}</h3>
              </div>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground line-clamp-3 min-h-[60px]">{t.description}</p>
                <div className="flex items-center justify-between mt-5">
                  <span className="text-xs text-muted-foreground">{t.modules?.length ?? 0} modules</span>
                  <Button size="sm" variant="ghost" asChild>
                    <Link to={`/tracks/${t.slug}`}>Open <ArrowRight className="h-4 w-4 ml-1" /></Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
