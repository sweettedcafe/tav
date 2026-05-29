import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Award, Loader2, RotateCcw, Copy } from "lucide-react";
import { toast } from "sonner";

function genCode() {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AV-${part()}-${part()}`;
}

export default function AdminCertificates() {
  const { user } = useAuth();
  const [issued, setIssued] = useState<any[]>([]);
  const [eligible, setEligible] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<any | null>(null);
  const [form, setForm] = useState({ recipient_name: "", program_name: "The Analytics Vanguard", certificate_code: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: certs }, { data: subs }, { data: profs }] = await Promise.all([
      supabase.from("certificates").select("*").order("issued_at", { ascending: false }),
      supabase.from("project_submissions").select("user_id").eq("status", "approved"),
      supabase.from("profiles").select("id, full_name, email, handle"),
    ]);
    const profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
    const approvedByUser = new Map<string, number>();
    (subs ?? []).forEach((s: any) => approvedByUser.set(s.user_id, (approvedByUser.get(s.user_id) ?? 0) + 1));
    const issuedIds = new Set((certs ?? []).filter((c: any) => !c.revoked_at).map((c: any) => c.user_id));

    setIssued((certs ?? []).map((c: any) => ({ ...c, profile: profMap.get(c.user_id) })));
    setEligible(
      Array.from(approvedByUser.entries())
        .filter(([uid]) => !issuedIds.has(uid))
        .map(([uid, n]) => ({ user_id: uid, approved: n, profile: profMap.get(uid) }))
        .filter((e) => e.profile)
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startIssue = (row: any) => {
    setOpen(row);
    setForm({
      recipient_name: row.profile?.full_name || row.profile?.email || "",
      program_name: "The Analytics Vanguard",
      certificate_code: genCode(),
    });
  };

  const issue = async () => {
    if (!open) return;
    if (!form.recipient_name.trim()) return toast.error("Recipient name required");
    setSaving(true);
    const { error } = await supabase.from("certificates").insert({
      user_id: open.user_id,
      recipient_name: form.recipient_name.trim(),
      program_name: form.program_name.trim(),
      certificate_code: form.certificate_code.trim().toUpperCase(),
      issued_by: user?.id,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Certificate issued");
    setOpen(null);
    load();
  };

  const revoke = async (c: any) => {
    if (!confirm(`Revoke certificate ${c.certificate_code}?`)) return;
    const { error } = await supabase.from("certificates").update({ revoked_at: new Date().toISOString() }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Revoked");
    load();
  };

  const unrevoke = async (c: any) => {
    const { error } = await supabase.from("certificates").update({ revoked_at: null }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Reinstated");
    load();
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Verification link copied");
  };

  return (
    <div className="container-page py-10">
      <Helmet><title>Certificates — Admin</title></Helmet>
      <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">Certificates</h1>
      <p className="text-muted-foreground mb-8">Issue certificates to learners who complete the program and revoke if needed.</p>

      <h2 className="font-display text-xl font-semibold mb-3">Eligible learners ({eligible.length})</h2>
      <Card className="mb-10">
        <CardContent className="p-0">
          {loading ? <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-muted-foreground" /></div>
            : eligible.length === 0 ? <div className="p-8 text-center text-muted-foreground">No new eligible learners. Learners with at least one approved project appear here.</div>
            : (
              <ul className="divide-y">
                {eligible.map((e) => (
                  <li key={e.user_id} className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{e.profile?.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{e.profile?.email} · {e.approved} approved {e.approved === 1 ? "project" : "projects"}</div>
                    </div>
                    <Button size="sm" onClick={() => startIssue(e)}><Award className="h-4 w-4 mr-2" /> Issue certificate</Button>
                  </li>
                ))}
              </ul>
            )}
        </CardContent>
      </Card>

      <h2 className="font-display text-xl font-semibold mb-3">Issued certificates ({issued.length})</h2>
      <Card>
        <CardContent className="p-0">
          {issued.length === 0 ? <div className="p-8 text-center text-muted-foreground">None issued yet.</div> : (
            <ul className="divide-y">
              {issued.map((c) => (
                <li key={c.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-medium flex items-center gap-2">
                      {c.recipient_name}
                      {c.revoked_at && <Badge variant="destructive">Revoked</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-mono">{c.certificate_code}</span> · {c.program_name} · Issued {new Date(c.issued_at).toLocaleDateString()}
                      {c.profile?.email && <> · {c.profile.email}</>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => copyLink(c.certificate_code)}><Copy className="h-4 w-4" /></Button>
                    {c.revoked_at ? (
                      <Button variant="ghost" size="sm" onClick={() => unrevoke(c)}><RotateCcw className="h-4 w-4" /></Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => revoke(c)}>Revoke</Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Issue certificate</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Recipient name</Label><Input value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} /></div>
            <div><Label>Program name</Label><Input value={form.program_name} onChange={(e) => setForm({ ...form, program_name: e.target.value })} /></div>
            <div>
              <Label>Certificate code</Label>
              <div className="flex gap-2">
                <Input className="font-mono" value={form.certificate_code} onChange={(e) => setForm({ ...form, certificate_code: e.target.value })} />
                <Button variant="outline" type="button" onClick={() => setForm({ ...form, certificate_code: genCode() })}>Regenerate</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Used in the public verification URL: /verify/{form.certificate_code || "CODE"}</p>
            </div>
            <Button className="w-full" onClick={issue} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Issue certificate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
