import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { toast } from "sonner";
import { Quiz } from "@/components/learning/Quiz";
import { TryIt } from "@/components/learning/TryIt";

export default function LessonView() {
  const { slug, lessonId } = useParams();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<any>(null);
  const [completed, setCompleted] = useState(false);
  const [quiz, setQuiz] = useState<any>(null);

  useEffect(() => {
    if (!lessonId) return;
    (async () => {
      const { data: l } = await supabase.from("lessons").select("*").eq("id", lessonId).maybeSingle();
      setLesson(l);
      const { data: q } = await supabase.from("quizzes").select("*, quiz_questions:quiz_questions_public(*)").eq("lesson_id", lessonId).maybeSingle();
      setQuiz(q);
      if (user) {
        const { data: prog } = await supabase.from("lesson_progress").select("id").eq("user_id", user.id).eq("lesson_id", lessonId).maybeSingle();
        setCompleted(!!prog);
      }
    })();
  }, [lessonId, user]);

  const markComplete = async () => {
    if (!user || !lessonId) return;
    const { error } = await supabase.from("lesson_progress").insert({ user_id: user.id, lesson_id: lessonId });
    if (error && !error.message.includes("duplicate")) { toast.error(error.message); return; }
    setCompleted(true);
    toast.success("Lesson complete!");
  };

  if (!lesson) return <div className="container-page py-10">Loading…</div>;

  return (
    <div className="container-page py-10 max-w-3xl">
      <Helmet><title>{lesson.title} — The Analytics Vanguard</title></Helmet>
      <Button variant="ghost" size="sm" asChild className="mb-4"><Link to={`/tracks/${slug}`}><ArrowLeft className="h-4 w-4 mr-2" /> Back to track</Link></Button>
      <h1 className="font-display text-3xl md:text-4xl font-semibold mb-3">{lesson.title}</h1>
      {lesson.summary && (
        <p className="text-lg text-muted-foreground mb-6 leading-relaxed">{lesson.summary}</p>
      )}

      {lesson.video_url && (
        <div className="aspect-video rounded-lg overflow-hidden mb-6 bg-muted">
          <iframe src={lesson.video_url} className="w-full h-full" allowFullScreen title="Lesson video" />
        </div>
      )}

      <article className="lesson-prose prose prose-slate max-w-none prose-headings:font-display prose-h2:mt-10 prose-h2:border-b prose-h2:pb-2 prose-a:text-primary">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{lesson.content || "_No content yet._"}</ReactMarkdown>
      </article>

      {lesson.try_it_sql && (
        <TryIt initialSql={lesson.try_it_sql} datasetSlugs={lesson.try_it_datasets ?? []} />
      )}

      {quiz && (
        <div className="mt-10">
          <Quiz quiz={quiz} onPass={markComplete} />
        </div>
      )}

      <div className="mt-10 flex items-center justify-between border-t pt-6">
        <div className="text-sm text-muted-foreground">{completed ? "Completed ✓" : "Mark this lesson done when ready."}</div>
        {!completed && <Button onClick={markComplete}><CheckCircle2 className="h-4 w-4 mr-2" /> Mark complete</Button>}
      </div>
    </div>
  );
}
