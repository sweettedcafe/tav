import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";

const CATEGORIES = ["all", "sql", "python", "statistics", "case", "behavioral"];

export default function InterviewBank() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [cat, setCat] = useState("all");
  const [diff, setDiff] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    supabase.from("interview_questions").select("*").eq("is_published", true).order("difficulty").then(({ data }) => setQuestions(data ?? []));
  }, []);

  const filtered = useMemo(() => questions.filter((x) =>
    (cat === "all" || x.category === cat) &&
    (diff === "all" || x.difficulty === diff) &&
    (!q || (x.title + " " + x.prompt).toLowerCase().includes(q.toLowerCase()))
  ), [questions, cat, diff, q]);

  return (
    <div className="container-page py-10 max-w-4xl">
      <Helmet><title>Interview prep — The Analytics Vanguard</title></Helmet>
      <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">Technical interview prep</h1>
      <p className="text-muted-foreground mb-6">Practice the questions you'll actually be asked in data analyst interviews — SQL, Python, stats, case, and behavioral.</p>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <Input placeholder="Search questions…" value={q} onChange={(e) => setQ(e.target.value)} className="md:max-w-xs" />
        <Tabs value={cat} onValueChange={setCat}><TabsList>{CATEGORIES.map((c) => <TabsTrigger key={c} value={c} className="capitalize">{c}</TabsTrigger>)}</TabsList></Tabs>
        <Tabs value={diff} onValueChange={setDiff}><TabsList>{["all","beginner","intermediate","advanced"].map((d) => <TabsTrigger key={d} value={d} className="capitalize">{d}</TabsTrigger>)}</TabsList></Tabs>
      </div>

      <div className="space-y-3">
        {filtered.map((qu) => (
          <Card key={qu.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="capitalize">{qu.category}</Badge>
                    <Badge variant="outline" className="capitalize">{qu.difficulty}</Badge>
                  </div>
                  <h3 className="font-display font-semibold text-lg">{qu.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{qu.prompt}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setOpen({ ...open, [qu.id]: !open[qu.id] })}>
                  {open[qu.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
              {open[qu.id] && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  {qu.hints && (
                    <div className="flex gap-2 text-sm bg-muted/50 p-3 rounded">
                      <Lightbulb className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <div><span className="font-medium">Hint: </span>{qu.hints}</div>
                    </div>
                  )}
                  {qu.sample_answer && (
                    <div>
                      <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">Sample answer</div>
                      <pre className="text-xs bg-primary text-primary-foreground p-3 rounded overflow-x-auto whitespace-pre-wrap font-mono">{qu.sample_answer}</pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-muted-foreground text-center py-12">No questions match your filters.</p>}
      </div>
    </div>
  );
}
