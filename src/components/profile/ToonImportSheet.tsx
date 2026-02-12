import { useState, useRef } from "react";
import { Upload, FileText, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ToonImportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: () => void;
}

/**
 * Minimal TOON decoder — handles the subset used by Resonance Profiles.
 *
 * TOON uses indentation-based nesting (like YAML) with `key: value` pairs.
 * Arrays use `[N]` headers or `- item` list syntax.
 * We parse into a plain JS object then merge into resonance_data.
 */
async function decodeToon(input: string): Promise<Record<string, unknown>> {
  try {
    const toon = await import("@toon-format/toon");
    return toon.decode(input) as Record<string, unknown>;
  } catch {
    // Fallback: attempt JSON parse (TOON encodes the JSON data model)
    try {
      return JSON.parse(input);
    } catch {
      throw new Error("Could not parse input. Please ensure it's valid TOON or JSON format.");
    }
  }
}

const ToonImportSheet = ({ open, onOpenChange, onImported }: ToonImportSheetProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rawContent, setRawContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRawContent(text);
      tryParse(text);
    };
    reader.readAsText(file);
  };

  const tryParse = async (text: string) => {
    setError(null);
    setPreview(null);
    if (!text.trim()) return;
    try {
      const parsed = await decodeToon(text);
      setPreview(parsed);
    } catch (err: any) {
      setError(err.message || "Parse error");
    }
  };

  const handleImport = async () => {
    if (!user || !preview) return;
    setImporting(true);
    try {
      // Fetch existing resonance_data to merge
      const { data: existing } = await supabase
        .from("profiles")
        .select("resonance_data")
        .eq("id", user.id)
        .single();

      const currentData = (existing?.resonance_data as Record<string, unknown>) || {};
      const merged = deepMerge(currentData, preview);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ resonance_data: merged as any })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast.success("Resonance profile imported successfully");
      onImported?.();
      onOpenChange(false);
      resetState();
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const resetState = () => {
    setRawContent("");
    setFileName(null);
    setPreview(null);
    setError(null);
  };

  const sectionCount = preview ? Object.keys(preview).length : 0;

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl px-4 pt-6 pb-8 overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="font-display text-lg">Import Resonance Profile</SheetTitle>
          <p className="text-xs text-muted-foreground">
            Paste TOON or JSON, or upload a <code className="rounded bg-secondary px-1">.toon</code> / <code className="rounded bg-secondary px-1">.json</code> file
          </p>
        </SheetHeader>

        {/* File upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".toon,.json,.txt"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          variant="outline"
          className="w-full mb-3 gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {fileName || "Choose file…"}
        </Button>

        {/* Text area */}
        <Textarea
          value={rawContent}
          onChange={(e) => {
            setRawContent(e.target.value);
            tryParse(e.target.value);
          }}
          placeholder={`core:\n  attentionModel: Engagement through emergent alignment\n  activationVectors:\n    attracts:\n      - competent_weirdness\n      - layered_meaning`}
          rows={10}
          className="font-mono text-xs mb-3"
        />

        {/* Status */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 mb-3"
            >
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{error}</p>
            </motion.div>
          )}

          {preview && !error && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl bg-primary/5 border border-primary/20 p-3 mb-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-foreground">
                  Parsed successfully — {sectionCount} section{sectionCount !== 1 ? "s" : ""} detected
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.keys(preview).map((key) => (
                  <span
                    key={key}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                  >
                    {key}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Import button */}
        <Button
          className="w-full gap-2"
          disabled={!preview || importing}
          onClick={handleImport}
        >
          {importing ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
              Importing…
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Import & Merge
            </>
          )}
        </Button>

        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Data will be merged with your existing resonance profile. Existing fields are preserved unless overwritten.
        </p>
      </SheetContent>
    </Sheet>
  );
};

/** Deep-merge two objects — arrays are replaced, not concatenated */
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = target[key];
    if (sv && typeof sv === "object" && !Array.isArray(sv) && tv && typeof tv === "object" && !Array.isArray(tv)) {
      result[key] = deepMerge(tv as Record<string, unknown>, sv as Record<string, unknown>);
    } else {
      result[key] = sv;
    }
  }
  return result;
}

export default ToonImportSheet;
