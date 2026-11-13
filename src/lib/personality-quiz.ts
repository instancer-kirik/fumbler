// Scoring + profile prefill for the personality quiz.
// Option effects are stored in the database as { s: {trait: points}, a: {fieldPath: values} }.

export type QuizEffects = {
  s?: Record<string, number>;
  a?: Record<string, unknown>;
};

export type QuizResult = {
  mbti: string;
  attachment: string | null;
  internetCore: string | null;
  creativeMode: string | null;
  projectStyle: string | null;
  scores: Record<string, number>;
  adds: Record<string, unknown[] | string>;
};

const ATTACHMENT_LABELS: Record<string, string> = {
  secure: "Secure",
  anxious: "Anxious",
  avoidant: "Avoidant",
  fearful: "Fearful-avoidant",
};

const CORE_LABELS: Record<string, string> = {
  corecore: "Corecore",
  goblincore: "Goblincore",
  cottagecore: "Cottagecore",
  weirdcore: "Weirdcore",
  dreamcore: "Dreamcore",
  frutiger_aero: "Frutiger Aero",
};

const CREATIVE_LABELS: Record<string, string> = {
  maker: "Maker",
  worldbuilder: "Worldbuilder",
  collaborator: "Co-creator",
  director: "Creative director",
};

const PROJECT_LABELS: Record<string, string> = {
  solo: "Parallel practice",
  duo: "Creative duo",
  crew: "Small crew",
  network: "Loose network",
  starter: "Idea starter",
  builder: "Prototype builder",
  finisher: "Finishing energy",
  connector: "Audience connector",
};

const top = (scores: Record<string, number>, prefix: string): string | null => {
  let best: string | null = null;
  let bestVal = 0;
  for (const [k, v] of Object.entries(scores)) {
    if (!k.startsWith(prefix + ".")) continue;
    if (v > bestVal) {
      bestVal = v;
      best = k.slice(prefix.length + 1);
    }
  }
  return best;
};

export function scoreQuiz(chosen: QuizEffects[]): QuizResult {
  const scores: Record<string, number> = {};
  const adds: Record<string, unknown[] | string> = {};
  for (const eff of chosen) {
    for (const [k, v] of Object.entries(eff?.s ?? {})) {
      scores[k] = (scores[k] ?? 0) + Number(v || 0);
    }
    for (const [k, v] of Object.entries(eff?.a ?? {})) {
      if (Array.isArray(v)) {
        const prev = Array.isArray(adds[k]) ? (adds[k] as unknown[]) : [];
        const seen = new Set(prev.map((x) => JSON.stringify(x)));
        adds[k] = [...prev, ...v.filter((x) => !seen.has(JSON.stringify(x)))];
      } else if (typeof v === "string") {
        adds[k] = v;
      }
    }
  }
  const pick = (a: string, b: string) => ((scores[`mbti.${a}`] ?? 0) >= (scores[`mbti.${b}`] ?? 0) ? a : b);
  const mbti = pick("I", "E") + pick("N", "S") + pick("F", "T") + pick("P", "J");
  const att = top(scores, "att");
  const core = top(scores, "core");
  const creative = top(scores, "creative");
  const project = top(scores, "project");
  return {
    mbti,
    attachment: att ? ATTACHMENT_LABELS[att] ?? att : null,
    internetCore: core ? CORE_LABELS[core] ?? core : null,
    creativeMode: creative ? CREATIVE_LABELS[creative] ?? creative : null,
    projectStyle: project ? PROJECT_LABELS[project] ?? project : null,
    scores,
    adds,
  };
}

export type PrefillGroups = {
  frames: boolean;
  desires: boolean;
  archetypes: boolean;
  qualities: boolean;
  projects: boolean;
};

type Obj = Record<string, any>;
const uniq = (a: unknown[]) => {
  const seen = new Set<string>();
  return a.filter((x) => {
    const k = typeof x === "string" ? x.toLowerCase() : JSON.stringify(x);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

/** Merge quiz results into existing resonance_data without removing anything the user wrote. */
export function applyQuizToResonance(raw: Obj, r: QuizResult, g: PrefillGroups): Obj {
  const data: Obj = JSON.parse(JSON.stringify(raw ?? {}));
  const addArr = (path: string[], vals: unknown[]) => {
    let cur = data;
    for (const p of path.slice(0, -1)) cur = cur[p] = cur[p] && typeof cur[p] === "object" ? cur[p] : {};
    const key = path[path.length - 1];
    cur[key] = uniq([...(Array.isArray(cur[key]) ? cur[key] : []), ...vals]);
  };

  if (g.frames) {
    data.frames = data.frames ?? {};
    data.frames.mbti = { ...(data.frames.mbti ?? {}), type: r.mbti };
    const custom: Obj[] = Array.isArray(data.frames.custom) ? data.frames.custom : [];
    const upsert = (system: string, value: string | null) => {
      if (!value) return;
      const i = custom.findIndex((c) => c?.system === system);
      if (i >= 0) custom[i] = { ...custom[i], value };
      else custom.push({ system, value, notes: "From the Fumbler quiz" });
    };
    upsert("Attachment style", r.attachment);
    upsert("Internet core", r.internetCore);
    data.frames.custom = custom;
  }

  if (g.archetypes && Array.isArray(r.adds.archetypes)) {
    const existing: Obj[] = Array.isArray(data.archetypes) ? data.archetypes : [];
    const names = new Set(existing.map((a) => String(a?.name ?? "").toLowerCase()));
    for (const a of r.adds.archetypes as Obj[]) {
      if (!names.has(String(a.name).toLowerCase())) existing.push({ activationContext: "", ...a });
    }
    data.archetypes = existing;
  }

  if (g.qualities) {
    if (Array.isArray(r.adds.qualities)) addArr(["qualities"], r.adds.qualities);
    if (Array.isArray(r.adds.values)) addArr(["values"], r.adds.values);
    if (Array.isArray(r.adds.aesthetics)) addArr(["aesthetics"], r.adds.aesthetics);
  }

  if (g.projects) {
    const roles = r.adds["offering.roles"];
    if (Array.isArray(roles)) addArr(["offering", "roles"], roles);
    if (Array.isArray(r.adds.aspirations)) addArr(["aspirations"], r.adds.aspirations);

    if (Array.isArray(r.adds.skills)) {
      const existing: Obj[] = Array.isArray(data.skills) ? data.skills : [];
      const names = new Set(existing.map((s) => String(s?.name ?? "").trim().toLowerCase()));
      for (const skill of r.adds.skills as Obj[]) {
        const name = String(skill?.name ?? "").trim();
        if (!name || names.has(name.toLowerCase())) continue;
        existing.push({
          name,
          level: skill.level || "working",
          intent: skill.intent || "practice",
          note: skill.note || "Suggested by the quiz; edit freely.",
        });
        names.add(name.toLowerCase());
      }
      data.skills = existing;
    }

    if (Array.isArray(r.adds.collaborations)) {
      const existing: Obj[] = Array.isArray(data.collaborations) ? data.collaborations : [];
      const keyOf = (c: Obj) => `${String(c?.kind ?? "").trim().toLowerCase()}|${String(c?.role ?? "").trim().toLowerCase()}`;
      const keys = new Set(existing.map(keyOf));
      for (const collab of r.adds.collaborations as Obj[]) {
        const kind = String(collab?.kind ?? "").trim();
        const role = String(collab?.role ?? "").trim();
        if ((!kind && !role) || keys.has(keyOf(collab))) continue;
        existing.push({
          kind,
          role,
          lookingFor: collab.lookingFor || "",
          notes: collab.notes || "Suggested by the quiz; edit freely.",
        });
        keys.add(keyOf(collab));
      }
      data.collaborations = existing;
    }
  }

  if (g.desires) {
    const facets = ["intellectual", "relational", "intensity", "play", "avoid"];
    const fromQuiz: Obj = { label: "From the quiz" };
    let any = false;
    for (const f of facets) {
      const v = r.adds[`desires.${f}`];
      fromQuiz[f] = Array.isArray(v) ? v : [];
      if (fromQuiz[f].length) any = true;
    }
    if (any) {
      const list: Obj[] = Array.isArray(data.desires) ? data.desires : [];
      const i = list.findIndex((d) => d?.label === "From the quiz");
      if (i >= 0) {
        for (const f of facets) list[i][f] = uniq([...(list[i][f] ?? []), ...fromQuiz[f]]);
      } else list.push(fromQuiz);
      data.desires = list;
    }
    const modes = r.adds["powerDynamics.expressionModes"];
    if (Array.isArray(modes)) addArr(["powerDynamics", "expressionModes"], modes);
    for (const k of ["receiveLoveThrough", "expressLoveThrough"]) {
      const v = r.adds[`languages.${k}`];
      if (Array.isArray(v)) addArr(["languages", k], v);
    }
    const cs = r.adds["languages.communicationStyle"];
    if (typeof cs === "string") {
      data.languages = data.languages ?? {};
      if (!data.languages.communicationStyle) data.languages.communicationStyle = cs;
    }
  }
  return data;
}
