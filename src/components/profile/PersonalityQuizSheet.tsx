import { useEffect, useMemo, useState } from "react";
import { Sparkles, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  scoreQuiz,
  applyQuizToResonance,
  type QuizEffects,
  type PrefillGroups,
} from "@/lib/personality-quiz";

type Option = { id: string; position: number; label: string; effects: QuizEffects };
type Question = { id: string; position: number; framework: string; prompt: string; quiz_options: Option[] };

const FRAMEWORK_LABEL: Record<string, string> = {
  mbti: "Personality type",
  attachment: "Love & attachment",
  internet: "Internet core",
  dynamics: "Relationship dynamics",
  creative: "Creative practice",
  projects: "Projects & collaborations",
};

const GROUPS: { key: keyof PrefillGroups; label: string }[] = [
  { key: "frames", label: "Identity Frames (type, attachment, core)" },
  { key: "desires", label: "Desires, dynamics & love languages" },
  { key: "archetypes", label: "Archetypes" },
  { key: "qualities", label: "Qualities, values & aesthetics" },
  { key: "projects", label: "Creative roles, skills & collaborations" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const PersonalityQuizSheet = ({ open, onOpenChange, onSaved }: Props) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [groups, setGroups] = useState<PrefillGroups>({ frames: true, desires: true, archetypes: true, qualities: true, projects: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || questions.length) return;
    setLoading(true);
    (supabase as any)
      .from("quiz_questions")
      .select("id, position, framework, prompt, quiz_options(id, position, label, effects)")
      .eq("active", true)
      .order("position")
      .then(({ data, error }: any) => {
        if (error) toast.error("Couldn't load the quiz");
        else
          setQuestions(
            (data ?? []).map((q: Question) => ({
              ...q,
              quiz_options: [...(q.quiz_options ?? [])].sort((a, b) => a.position - b.position),
            })),
          );
        setLoading(false);
      });
  }, [open, questions.length]);

  const done = questions.length > 0 && step >= questions.length;
  const result = useMemo(() => {
    if (!done) return null;
    const chosen = questions
      .map((q) => q.quiz_options.find((o) => o.id === answers[q.id])?.effects)
      .filter(Boolean) as QuizEffects[];
    return scoreQuiz(chosen);
  }, [done, questions, answers]);

  const pick = (qid: string, oid: string) => {
    setAnswers((a) => ({ ...a, [qid]: oid }));
    setStep((s) => s + 1);
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
  };

  const save = async () => {
    if (!user || !result) return;
    setSaving(true);
    try {
      const { data: existing } = await supabase.from("profiles").select("resonance_data").eq("id", user.id).maybeSingle();
      const merged = applyQuizToResonance((existing?.resonance_data as any) ?? {}, result, groups);
      const { error } = await supabase.from("profiles").update({ resonance_data: merged }).eq("id", user.id);
      if (error) throw error;
      const { error: resultError } = await (supabase as any).from("quiz_results").insert({ user_id: user.id, answers, result });
      if (resultError) throw resultError;
      toast.success("Added to your Resonance profile");
      onSaved?.();
      onOpenChange(false);
      reset();
    } catch (e: any) {
      toast.error("Couldn't save: " + (e?.message ?? "unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const q = questions[step];
  const chip = (label: string, index: number) => (
    <span key={`${label}-${index}`} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">{label}</span>
  );
  const suggestionLabel = (value: any) =>
    typeof value === "string" ? value : value?.name ?? value?.role ?? value?.kind ?? value?.label ?? "Profile suggestion";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="z-[70] h-[85vh] rounded-t-3xl px-4 pt-6 pb-8 overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="font-display text-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Personality quiz
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            {questions.length ? `${questions.length} quick questions. ` : ""}Your answers suggest a type and fill in parts of your profile; you pick what to keep.
          </p>
        </SheetHeader>

        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {!loading && q && (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{FRAMEWORK_LABEL[q.framework] ?? q.framework}</span>
                <span>{step + 1} / {questions.length}</span>
              </div>
              <Progress value={(step / questions.length) * 100} />
            </div>
            <h3 className="font-display text-xl text-foreground">{q.prompt}</h3>
            <div className="space-y-2">
              {q.quiz_options.map((o) => (
                <button
                  key={o.id}
                  onClick={() => pick(q.id, o.id)}
                  className={`w-full rounded-2xl border p-4 text-left text-sm transition-colors hover:bg-secondary ${
                    answers[q.id] === o.id ? "border-primary bg-secondary" : "border-border bg-card"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setStep((s) => s + 1)}>Skip</Button>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Type", result.mbti],
                ["Attachment", result.attachment ?? "—"],
                ["Core", result.internetCore ?? "—"],
                ["Creative pull", result.creativeMode ?? "—"],
                ["Project pull", result.projectStyle ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-card p-3 text-center shadow-card">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</div>
                  <div className="font-display text-base text-foreground">{v}</div>
                </div>
              ))}
            </div>

            {Object.keys(result.adds).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Suggestions from your answers</p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(
                    new Set(
                      Object.values(result.adds).flatMap((v) =>
                        (Array.isArray(v) ? v : [v]).map((x: any) => suggestionLabel(x)),
                      ),
                    ),
                  ).map((label, i) => chip(label, i))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Add to my profile</p>
              {GROUPS.map((g) => (
                <label key={g.key} className="flex items-center gap-3 rounded-xl bg-card p-3 text-sm">
                  <Checkbox checked={groups[g.key]} onCheckedChange={(c) => setGroups((s) => ({ ...s, [g.key]: !!c }))} />
                  {g.label}
                </label>
              ))}
              <p className="text-[11px] text-muted-foreground">Nothing you've already written is removed. Visibility settings stay the same. Edit any suggested skill or project afterward.</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={reset}>Retake</Button>
              <Button className="flex-1" onClick={save} disabled={saving}>{saving ? "Saving…" : "Add to profile"}</Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default PersonalityQuizSheet;
