import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, BarChart3, Code2, Trophy, Database, BookOpen, Sparkles } from "lucide-react";
import { Helmet } from "react-helmet-async";

const features = [
  { icon: BookOpen, title: "Structured Tracks", desc: "SQL, Python, and Statistics — beginner to advanced, built for first-time analysts." },
  { icon: Code2, title: "In-browser SQL Lab", desc: "Run real queries against real datasets, instantly. No setup, no installs." },
  { icon: Database, title: "Real Datasets", desc: "Practice on curated datasets that mirror what you'll see on the job." },
  { icon: Trophy, title: "Portfolio Projects", desc: "Ship 3+ capstones reviewed by your mentor. Showcase them on a public profile." },
  { icon: BarChart3, title: "Mentor Feedback", desc: "Submissions are scored against a rubric with personalized written feedback." },
  { icon: Sparkles, title: "Verifiable Certificate", desc: "Earn a professional certificate, signed and verifiable by URL." },
];

export default function Landing() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>The Analytics Vanguard — Land Your First Data Analytics Role</title>
        <meta name="description" content="A guided learning program for fresh graduates breaking into data analytics. Master SQL, Python, and statistics with hands-on projects and a verifiable certificate." />
        <link rel="canonical" href="/" />
      </Helmet>

      {/* Nav */}
      <header className="border-b border-border/60 backdrop-blur-sm sticky top-0 z-40 bg-background/80">
        <div className="container-page flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-gradient-hero grid place-items-center text-primary-foreground font-display font-bold">AV</div>
            <span className="font-display text-lg font-semibold tracking-tight">The Analytics Vanguard</span>
          </Link>
          <nav className="flex items-center gap-2">
            {user ? (
              <Button asChild>
                <Link to={isAdmin ? "/admin" : "/dashboard"}>Go to {isAdmin ? "admin" : "dashboard"}</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild><Link to="/auth">Log in</Link></Button>
                <Button asChild><Link to="/auth?mode=signup">Get started</Link></Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, hsl(var(--accent) / 0.4), transparent 40%), radial-gradient(circle at 80% 60%, hsl(var(--accent) / 0.3), transparent 50%)" }} />
        <div className="container-page relative py-24 md:py-32 text-primary-foreground">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium border border-primary-foreground/20">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> An alumni initiative
            </span>
            <h1 className="mt-6 font-display text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05]">
              Become the analyst <span className="text-gradient-accent">every team wants to hire.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
              The Analytics Vanguard is a guided program for fresh graduates breaking into data analytics. Learn SQL, Python, and statistics through real projects — and walk away with a portfolio and certificate that get you interviews.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow" asChild>
                <Link to="/auth?mode=signup">Start the program <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="#tracks">Explore the curriculum</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="tracks" className="container-page py-20 md:py-28">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Everything you need to land that first analytics role.</h2>
          <p className="mt-4 text-muted-foreground text-lg">Designed end-to-end so you don't waste a single afternoon.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="surface-card p-6 hover:shadow-elegant transition-all duration-300">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-24">
        <div className="surface-card p-10 md:p-14 bg-gradient-hero text-primary-foreground text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold">Your first analytics role starts here.</h2>
          <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">Free for fresh graduates of our alma mater. Self-paced, mentor-guided, certificate-backed.</p>
          <Button size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90" asChild>
            <Link to="/auth?mode=signup">Create your account</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="container-page py-8 text-sm text-muted-foreground flex flex-col md:flex-row gap-3 items-center justify-between">
          <p>© {new Date().getFullYear()} The Analytics Vanguard. An alumni initiative.</p>
          <p>Powered by data, mentorship, and the people who came before you.</p>
        </div>
      </footer>
    </div>
  );
}
