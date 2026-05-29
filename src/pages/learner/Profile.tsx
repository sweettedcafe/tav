import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function Profile() {
  const { user } = useAuth();
  const [p, setP] = useState<any>({ full_name: "", handle: "", headline: "", bio: "", avatar_url: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => data && setP(data));
  }, [user]);

  const save = async () => {
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      full_name: p.full_name, handle: p.handle, headline: p.headline, bio: p.bio, avatar_url: p.avatar_url,
    }).eq("id", user!.id);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved.");
  };

  return (
    <div className="container-page py-10 max-w-2xl">
      <Helmet><title>Profile — The Analytics Vanguard</title></Helmet>
      <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">Your profile</h1>
      <p className="text-muted-foreground mb-6">This is what shows up on your public portfolio at <code className="text-xs">/p/{p.handle || "your-handle"}</code></p>
      <Card><CardContent className="p-6 space-y-4">
        <div><Label>Full name</Label><Input value={p.full_name ?? ""} onChange={(e) => setP({ ...p, full_name: e.target.value })} /></div>
        <div><Label>Public handle</Label><Input value={p.handle ?? ""} onChange={(e) => setP({ ...p, handle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} /></div>
        <div><Label>Headline</Label><Input value={p.headline ?? ""} onChange={(e) => setP({ ...p, headline: e.target.value })} placeholder="Aspiring data analyst | SQL · Python · Tableau" /></div>
        <div><Label>Bio</Label><Textarea rows={5} value={p.bio ?? ""} onChange={(e) => setP({ ...p, bio: e.target.value })} /></div>
        <div><Label>Avatar URL</Label><Input value={p.avatar_url ?? ""} onChange={(e) => setP({ ...p, avatar_url: e.target.value })} placeholder="https://..." /></div>
        <div className="flex gap-2">
          <Button onClick={save} disabled={loading}>Save changes</Button>
          {p.handle && <Button variant="outline" asChild><Link to={`/p/${p.handle}`} target="_blank">View public portfolio</Link></Button>}
        </div>
      </CardContent></Card>
    </div>
  );
}
