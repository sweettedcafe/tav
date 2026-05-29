import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function AdminOverview() {
  const { user, isAdmin, refreshRoles } = useAuth();
  const [counts, setCounts] = useState({ learners: 0, tracks: 0, pendingSubs: 0, certs: 0 });
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    (async () => {
      const { count } = await supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
      setHasAdmin((count ?? 0) > 0);
      if (isAdmin) {
        const [{ count: learners }, { count: tracks }, { count: pendingSubs }, { count: certs }] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("tracks").select("*", { count: "exact", head: true }),
          supabase.from("project_submissions").select("*", { count: "exact", head: true }).in("status", ["submitted", "under_review"]),
          supabase.from("certificates").select("*", { count: "exact", head: true }).is("revoked_at", null),
        ]);
        setCounts({ learners: learners ?? 0, tracks: tracks ?? 0, pendingSubs: pendingSubs ?? 0, certs: certs ?? 0 });
      }
    })();
  }, [isAdmin]);

  const claimAdmin = async () => {
    if (!user) return;
    setClaiming(true);
    const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role: "admin" });
    setClaiming(false);
    if (error) { toast.error(error.message); return; }
    await refreshRoles();
    toast.success("You are now an admin.");
    window.location.reload();
  };

  if (hasAdmin === false && !isAdmin) {
    return (
      <div className="container-page py-20 max-w-md">
        <Helmet><title>Claim admin — The Analytics Vanguard</title></Helmet>
        <Card><CardContent className="p-8 text-center">
          <ShieldCheck className="h-12 w-12 text-accent mx-auto mb-3" />
          <h1 className="font-display text-2xl font-semibold">Become the program admin</h1>
          <p className="text-sm text-muted-foreground mt-2">No admin exists yet. As the founder of this program, claim admin access now.</p>
          <Button className="mt-5 w-full" onClick={claimAdmin} disabled={claiming}>
            {claiming && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Claim admin role
          </Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <Helmet><title>Admin overview — The Analytics Vanguard</title></Helmet>
      <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">Program overview</h1>
      <p className="text-muted-foreground mb-8">Welcome back, mentor.</p>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Learners", value: counts.learners, to: "/admin/learners" },
          { label: "Tracks published", value: counts.tracks, to: "/admin/curriculum" },
          { label: "Pending submissions", value: counts.pendingSubs, to: "/admin/submissions" },
          { label: "Certificates issued", value: counts.certs, to: "/admin/certificates" },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-muted-foreground">{s.label}</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-semibold">{s.value}</div>
              <Link to={s.to} className="text-xs text-primary hover:underline">Open →</Link>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-8"><CardContent className="p-6">
        <h2 className="font-display text-xl font-semibold mb-2">Getting started</h2>
        <ol className="list-decimal pl-5 text-sm space-y-1 text-muted-foreground">
          <li>Build your <Link to="/admin/curriculum" className="text-primary underline">curriculum</Link>: tracks → modules → lessons.</li>
          <li>Upload <Link to="/admin/datasets" className="text-primary underline">datasets</Link> for SQL exercises and projects.</li>
          <li>Review <Link to="/admin/submissions" className="text-primary underline">submissions</Link> as learners ship them.</li>
          <li>Issue <Link to="/admin/certificates" className="text-primary underline">certificates</Link> when learners complete the program.</li>
        </ol>
      </CardContent></Card>
    </div>
  );
}
