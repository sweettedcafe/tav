import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(72),
});

export default function Auth() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">(params.get("mode") === "signup" ? "signup" : "login");
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse({ fullName, email, password });
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: parsed.data.fullName } },
        });
        if (error) throw error;
        toast.success("Welcome to the Vanguard!");
        navigate("/dashboard");
      } else {
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
      if (result.error) { toast.error(result.error.message ?? "Google sign-in failed"); return; }
      if (result.redirected) return;
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message ?? "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <Helmet><title>{mode === "signup" ? "Join" : "Log in"} — The Analytics Vanguard</title></Helmet>

      <div className="hidden md:flex relative overflow-hidden gradient-hero text-primary-foreground p-12 flex-col justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-md bg-primary-foreground/10 border border-primary-foreground/20 grid place-items-center font-display font-bold">AV</div>
          <span className="font-display text-lg font-semibold">The Analytics Vanguard</span>
        </Link>
        <div className="relative">
          <h2 className="font-display text-4xl font-semibold leading-tight">"The shortest path from graduation to hired."</h2>
          <p className="mt-4 text-primary-foreground/70">A learning program built by alumni who've walked the road you're about to walk.</p>
        </div>
        <p className="text-sm text-primary-foreground/60">© {new Date().getFullYear()} The Analytics Vanguard</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-0 shadow-none md:border md:shadow-card-elegant">
          <CardHeader>
            <CardTitle className="font-display text-2xl">{mode === "signup" ? "Join the Vanguard" : "Welcome back"}</CardTitle>
            <CardDescription>{mode === "signup" ? "Create an account to start your analytics journey." : "Log in to continue your program."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 11v3.2h5.6c-.2 1.4-1.6 4.2-5.6 4.2-3.4 0-6.1-2.8-6.1-6.4S8.6 5.6 12 5.6c1.9 0 3.2.8 4 1.5L18.4 5C16.7 3.5 14.6 2.6 12 2.6 6.8 2.6 2.6 6.8 2.6 12s4.2 9.4 9.4 9.4c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z"/></svg>
              Continue with Google
            </Button>
            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Juan Dela Cruz" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@university.edu" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === "signup" ? 8 : 1} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "signup" ? "Create account" : "Log in"}
              </Button>
            </form>
            <p className="mt-4 text-sm text-center text-muted-foreground">
              {mode === "signup" ? "Already a Vanguard?" : "New here?"}{" "}
              <button type="button" className="text-primary font-medium hover:underline" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>
                {mode === "signup" ? "Log in" : "Create an account"}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
