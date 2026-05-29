import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Award, CheckCircle2, XCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { formatCell } from "@/lib/format";

export default function VerifyCertificate() {
  const { code } = useParams();
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    supabase.rpc("verify_certificate", { _code: code }).maybeSingle().then(({ data }: any) => {
      setCert(data ? { ...data, profiles: { full_name: data.full_name, handle: data.handle } } : null);
      setLoading(false);
    });
  }, [code]);

  if (loading) return <div className="container-page py-20 text-center">Verifying…</div>;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Helmet><title>Verify Certificate — The Analytics Vanguard</title></Helmet>
      <div className="container-page py-20 max-w-2xl">
        <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground">The Analytics Vanguard</Link>
        <Card className="mt-6"><CardContent className="p-10 text-center">
          {cert && !cert.revoked_at ? (
            <>
              <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
              <h1 className="font-display text-3xl font-semibold">Certificate verified</h1>
              <p className="mt-3 text-muted-foreground">This certificate was issued by The Analytics Vanguard.</p>
              <div className="mt-6 grid gap-2 text-sm">
                <div><span className="text-muted-foreground">Recipient:</span> <span className="font-semibold">{cert.recipient_name}</span></div>
                <div><span className="text-muted-foreground">Program:</span> {cert.program_name}</div>
                <div><span className="text-muted-foreground">Code:</span> <code className="font-mono text-xs">{cert.certificate_code}</code></div>
                <div><span className="text-muted-foreground">Issued:</span> {formatCell("issued_at", cert.issued_at)}</div>
              </div>
              {cert.profiles?.handle && <Button asChild className="mt-6"><Link to={`/p/${cert.profiles.handle}`}>View portfolio</Link></Button>}
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h1 className="font-display text-3xl font-semibold">{cert?.revoked_at ? "Certificate revoked" : "Not found"}</h1>
              <p className="mt-3 text-muted-foreground">We couldn't verify this certificate code.</p>
            </>
          )}
        </CardContent></Card>
      </div>
    </div>
  );
}
