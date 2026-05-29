import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Pencil, Trash2, BookOpen, Layers, FileText, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";

type Kind = "track" | "module" | "lesson";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminCurriculum() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ kind: Kind; data: any; parentId?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: t } = await supabase.from("tracks").select("*").order("sort_order");
    const { data: m } = await supabase.from("modules").select("*").order("sort_order");
    const { data: l } = await supabase.from("lessons").select("*").order("sort_order");
    const lessonsByModule = new Map<string, any[]>();
    (l ?? []).forEach((x) => {
      const arr = lessonsByModule.get(x.module_id) ?? [];
      arr.push(x); lessonsByModule.set(x.module_id, arr);
    });
    const modulesByTrack = new Map<string, any[]>();
    (m ?? []).forEach((x) => {
      const arr = modulesByTrack.get(x.track_id) ?? [];
      arr.push({ ...x, lessons: lessonsByModule.get(x.id) ?? [] });
      modulesByTrack.set(x.track_id, arr);
    });
    setTracks((t ?? []).map((x) => ({ ...x, modules: modulesByTrack.get(x.id) ?? [] })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const newTrack = () => setEditing({ kind: "track", data: { title: "", slug: "", description: "", level: "beginner", icon: "", sort_order: tracks.length, is_published: true } });
  const newModule = (trackId: string, count: number) => setEditing({ kind: "module", parentId: trackId, data: { title: "", slug: "", summary: "", track_id: trackId, sort_order: count, is_published: true } });
  const newLesson = (moduleId: string, count: number) => setEditing({ kind: "lesson", parentId: moduleId, data: { title: "", slug: "", summary: "", content: "", video_url: "", module_id: moduleId, sort_order: count } });

  const edit = (kind: Kind, data: any) => setEditing({ kind, data: { ...data } });

  const save = async () => {
    if (!editing) return;
    const d = editing.data;
    if (!d.title?.trim()) return toast.error("Title required");
    if (!d.slug?.trim()) d.slug = slugify(d.title);
    setSaving(true);
    const table = editing.kind === "track" ? "tracks" : editing.kind === "module" ? "modules" : "lessons";
    const payload: any = { ...d };
    delete payload.modules; delete payload.lessons; delete payload.created_at;
    const { error } = d.id
      ? await supabase.from(table).update(payload).eq("id", d.id)
      : await supabase.from(table).insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEditing(null);
    load();
  };

  const remove = async (kind: Kind, id: string) => {
    const label = kind === "track" ? "track (and all modules/lessons)" : kind === "module" ? "module (and all lessons)" : "lesson";
    if (!confirm(`Delete this ${label}?`)) return;
    const table = kind === "track" ? "tracks" : kind === "module" ? "modules" : "lessons";
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const reorder = async (kind: Kind, item: any, dir: -1 | 1) => {
    const table = kind === "track" ? "tracks" : kind === "module" ? "modules" : "lessons";
    const { error } = await supabase.from(table).update({ sort_order: (item.sort_order ?? 0) + dir }).eq("id", item.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="container-page py-10">
      <Helmet><title>Curriculum — Admin</title></Helmet>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">Curriculum</h1>
          <p className="text-muted-foreground">Tracks → modules → lessons. Click any item to edit.</p>
        </div>
        <Button onClick={newTrack}><Plus className="h-4 w-4 mr-2" /> New track</Button>
      </div>

      {loading ? <div className="p-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-muted-foreground" /></div>
        : tracks.length === 0 ? <Card><CardContent className="p-10 text-center text-muted-foreground">No tracks yet. Click "New track" to begin.</CardContent></Card>
        : (
          <Accordion type="multiple" className="space-y-3">
            {tracks.map((t) => (
              <AccordionItem key={t.id} value={t.id} className="border rounded-md bg-card">
                <div className="flex items-center gap-2 pr-3">
                  <AccordionTrigger className="flex-1 px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium">{t.title} <Badge variant="secondary" className="ml-2 capitalize">{t.level}</Badge> {!t.is_published && <Badge variant="destructive" className="ml-1">Draft</Badge>}</div>
                        <div className="text-xs text-muted-foreground">/{t.slug} · {t.modules.length} modules</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <Button variant="ghost" size="icon" onClick={() => reorder("track", t, -1)}><ChevronUp className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => reorder("track", t, 1)}><ChevronDown className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => edit("track", t)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove("track", t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <AccordionContent className="px-4 pb-4">
                  <div className="ml-6 space-y-2">
                    {t.modules.map((m: any) => (
                      <div key={m.id} className="border rounded-md">
                        <div className="flex items-center gap-2 p-2 bg-muted/30">
                          <Layers className="h-4 w-4 text-accent" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{m.title} {!m.is_published && <Badge variant="destructive" className="ml-2">Draft</Badge>}</div>
                            <div className="text-xs text-muted-foreground">{m.lessons.length} lessons</div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => reorder("module", m, -1)}><ChevronUp className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => reorder("module", m, 1)}><ChevronDown className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => edit("module", m)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => remove("module", m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                        <ul className="divide-y">
                          {m.lessons.map((l: any) => (
                            <li key={l.id} className="flex items-center gap-2 p-2 pl-8 text-sm">
                              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="flex-1 truncate">{l.title}</span>
                              <Button variant="ghost" size="icon" onClick={() => reorder("lesson", l, -1)}><ChevronUp className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => reorder("lesson", l, 1)}><ChevronDown className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => edit("lesson", l)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => remove("lesson", l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </li>
                          ))}
                          <li className="p-2 pl-8">
                            <Button variant="ghost" size="sm" onClick={() => newLesson(m.id, m.lessons.length)}><Plus className="h-3.5 w-3.5 mr-1" /> Add lesson</Button>
                          </li>
                        </ul>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => newModule(t.id, t.modules.length)}><Plus className="h-4 w-4 mr-2" /> Add module</Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.data?.id ? "Edit" : "New"} {editing?.kind}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 md:col-span-1"><Label>Title</Label><Input value={editing.data.title ?? ""} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, title: e.target.value } })} /></div>
                <div className="col-span-2 md:col-span-1"><Label>Slug</Label><Input value={editing.data.slug ?? ""} placeholder="auto from title" onChange={(e) => setEditing({ ...editing, data: { ...editing.data, slug: e.target.value } })} /></div>
              </div>

              {editing.kind === "track" && (
                <>
                  <div><Label>Description</Label><Textarea rows={3} value={editing.data.description ?? ""} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, description: e.target.value } })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Level</Label>
                      <select className="w-full mt-1 h-10 border rounded-md px-2 bg-background" value={editing.data.level} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, level: e.target.value } })}>
                        {["beginner", "intermediate", "advanced"].map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div><Label>Icon (lucide name, optional)</Label><Input value={editing.data.icon ?? ""} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, icon: e.target.value } })} /></div>
                  </div>
                </>
              )}

              {editing.kind === "module" && (
                <div><Label>Summary</Label><Textarea rows={2} value={editing.data.summary ?? ""} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, summary: e.target.value } })} /></div>
              )}

              {editing.kind === "lesson" && (
                <>
                  <div><Label>Summary</Label><Textarea rows={2} value={editing.data.summary ?? ""} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, summary: e.target.value } })} /></div>
                  <div><Label>Content (Markdown)</Label><Textarea rows={10} className="font-mono text-xs" value={editing.data.content ?? ""} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, content: e.target.value } })} /></div>
                  <div><Label>Video URL (optional)</Label><Input value={editing.data.video_url ?? ""} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, video_url: e.target.value } })} /></div>
                </>
              )}

              {editing.kind !== "lesson" && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.data.is_published ?? true} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, is_published: e.target.checked } })} /> Published
                </label>
              )}

              <Button onClick={save} disabled={saving} className="w-full">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
