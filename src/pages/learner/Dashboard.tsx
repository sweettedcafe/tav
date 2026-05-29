import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, BookOpen, Code2, Trophy, Award } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function LearnerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ tracks: 0, lessons: 0, completed: 0, projects: 0, exercises: 0, correct: 0, certIssued: false });
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ count: tracks }, { count: lessons }, { count: completed }, { count: projects }, { count: exercises }, { count: correct }, { data: cert }, { data: prof }] = await Promise.all([
        supabase.from("tracks").select("*", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("lessons").select("*", { count: "exact", head: true }),
        supabase.from("lesson_progress").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("project_submissions").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "approved"),
        supabase.from("exercises_public").select("*", { count: "exact", head: true }),
        supabase.from("exercise_submissions").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_correct", true),
        supabase.from("certificates").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);
      setStats({ tracks: tracks ?? 0, lessons: lessons ?? 0, completed: completed ?? 0, projects: projects ?? 0, exercises: exercises ?? 0, correct: correct ?? 0, certIssued: !!cert });
      setProfile(prof);
    })();
  }, [user]);

  const lessonPct = stats.lessons ? Math.round((stats.completed / stats.lessons) * 100) : 0;
  const exercisePct = stats.exercises ? Math.round((stats.correct / stats.exercises) * 100) : 0;

  return (
    <div className="container-page py-10">
      <Helmet><title>Dashboard — The Analytics Vanguard</title></Helmet>
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-semibold">Welcome back, {profile?.full_name?.split(" ")[0] ?? "Vanguard"}.</h1>
        <p className="text-muted-foreground mt-1">Here's where you are in the program.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-10">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-normal">Lesson progress</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-semibold">{lessonPct}%</div>
            <Progress value={lessonPct} className="mt-3" />
            <p className="text-xs text-muted-foreground mt-2">{stats.completed} of {stats.lessons} lessons</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-normal">SQL exercises</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-semibold">{exercisePct}%</div>
            <Progress value={exercisePct} className="mt-3" />
            <p className="text-xs text-muted-foreground mt-2">{stats.correct} of {stats.exercises} solved</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-normal">Approved projects</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-semibold">{stats.projects}</div>
            <p className="text-xs text-muted-foreground mt-3">{stats.certIssued ? "🎓 Certificate issued" : "Build your portfolio"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="gradient-hero p-6 text-primary-foreground">
            <BookOpen className="h-6 w-6 mb-3" />
            <h3 className="font-display text-xl font-semibold">Continue learning</h3>
            <p className="text-sm text-primary-foreground/70 mt-1">{stats.tracks} tracks waiting for you.</p>
          </div>
          <CardContent className="pt-6"><Button asChild className="w-full"><Link to="/tracks">Open learning tracks <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></CardContent>
        </Card>
        <Card className="overflow-hidden">
          <div className="bg-accent/10 p-6">
            <Code2 className="h-6 w-6 text-accent-foreground mb-3" />
            <h3 className="font-display text-xl font-semibold">Practice in the SQL lab</h3>
            <p className="text-sm text-muted-foreground mt-1">Run real queries against curated datasets.</p>
          </div>
          <CardContent className="pt-6"><Button variant="outline" asChild className="w-full"><Link to="/playground">Open playground</Link></Button></CardContent>
        </Card>
        <Card className="overflow-hidden">
          <div className="bg-muted p-6">
            <Trophy className="h-6 w-6 mb-3" />
            <h3 className="font-display text-xl font-semibold">Capstone projects</h3>
            <p className="text-sm text-muted-foreground mt-1">Build deliverables for your portfolio.</p>
          </div>
          <CardContent className="pt-6"><Button variant="outline" asChild className="w-full"><Link to="/projects">Browse projects</Link></Button></CardContent>
        </Card>
        <Card className="overflow-hidden">
          <div className="bg-secondary p-6">
            <Award className="h-6 w-6 mb-3" />
            <h3 className="font-display text-xl font-semibold">Your portfolio</h3>
            <p className="text-sm text-muted-foreground mt-1">Share your public profile with recruiters.</p>
          </div>
          <CardContent className="pt-6">
            <Button variant="outline" asChild className="w-full">
              <Link to={profile?.handle ? `/p/${profile.handle}` : "/profile"}>{profile?.handle ? "View public portfolio" : "Set up profile"}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
