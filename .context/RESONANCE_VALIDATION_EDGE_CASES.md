# Resonance Profile Validation & Edge Cases

## Overview

This document outlines validation rules, edge cases, and handling strategies for the unified resonance profile system.

The principle: **Be permissive in input, provide sensible defaults, guide users toward completeness.**

---

## Validation Rules by Layer

### Layer 1: Attention Model

**Required:**
- `type: "resonance_not_persuasion"` (hardcoded, non-negotiable)

**Optional:**
- `description: string` (free text, no length limit enforced)
- `activation_vectors: string[]` (tags, any content allowed)
- `repulsion_vectors: string[]` (tags, any content allowed)

**Validation Logic:**
```typescript
function validateAttentionModel(model: AttentionModel): ValidationResult {
  if (!model || model.type !== "resonance_not_persuasion") {
    return {
      valid: false,
      errors: ["Attention model type must be 'resonance_not_persuasion'"]
    };
  }
  
  return { valid: true, errors: [] };
}
```

**Edge Cases:**
- Empty description: ✅ OK (user can add later)
- Empty activation/repulsion vectors: ✅ OK (default to empty arrays)
- Malformed type: ❌ REJECT with error, suggest fix

---

### Layer 2: Archetypes

**Rules:**
- Each archetype must have `id` and `label`
- `id` must be unique within profile
- `class` must be one of: `"classic"`, `"modern"`, `"experimental"`, `"custom"`
- If `custom: true`, it's user-defined; if false/missing, it's a preset
- All other fields (`aesthetic`, `energy`, `dynamic`, `tone`, `performance`) can be empty strings or arrays

**Validation Logic:**
```typescript
function validateArchetype(arch: ArchetypePacket): ValidationResult {
  const errors = [];
  
  if (!arch.id || arch.id.trim() === "") {
    errors.push("Archetype must have an id");
  }
  
  if (!arch.label || arch.label.trim() === "") {
    errors.push("Archetype must have a label");
  }
  
  const validClasses = ["classic", "modern", "experimental", "custom"];
  if (arch.class && !validClasses.includes(arch.class)) {
    errors.push(`Archetype class must be one of: ${validClasses.join(", ")}`);
  }
  
  return errors.length === 0 
    ? { valid: true, errors: [] }
    : { valid: false, errors };
}

function validateArchetypeUniqueness(archetypes: ArchetypePacket[]): ValidationResult {
  const ids = archetypes.map(a => a.id);
  const unique = new Set(ids);
  
  if (ids.length !== unique.size) {
    return {
      valid: false,
      errors: ["Archetype ids must be unique within profile"]
    };
  }
  
  return { valid: true, errors: [] };
}
```

**Edge Cases:**

| Scenario | Behavior |
|----------|----------|
| Duplicate archetype ids | ❌ REJECT with error, suggest rename |
| Preset archetype id but `custom: true` | ⚠️ WARN: "This looks custom but uses preset id. Did you mean to create new?" |
| Empty aesthetic array | ✅ OK (user can add later) |
| Very long description fields | ✅ OK (no length limit enforced) |
| Special characters in id | ✅ OK (allow `my-archetype-123_v2`) |
| Whitespace-only fields | ❌ REJECT (trim and validate again) |

---

### Layer 3: Attraction Gradient

**Rules:**
- Either `slow_burn` or `fast_hook` (or both) must be present for the layer to be meaningful
- Within each gradient, timeline must be one of a predefined set
- `what_draws_in` / `what_hooks_immediately` are arrays (can be empty)

**Valid Timelines:**
```typescript
const VALID_TIMELINES = [
  "minutes to hours",
  "hours to days",
  "days to weeks",
  "weeks to months",
  "months to years"
];
```

**Validation Logic:**
```typescript
function validateAttractionGradient(grad: AttractionGradient): ValidationResult {
  const errors = [];
  
  if (!grad.slow_burn && !grad.fast_hook) {
    errors.push("Attraction gradient must have slow_burn or fast_hook (or both)");
  }
  
  if (grad.slow_burn) {
    if (grad.slow_burn.timeline && !VALID_TIMELINES.includes(grad.slow_burn.timeline)) {
      errors.push(`slow_burn timeline must be one of: ${VALID_TIMELINES.join(", ")}`);
    }
  }
  
  if (grad.fast_hook) {
    if (grad.fast_hook.timeline && !VALID_TIMELINES.includes(grad.fast_hook.timeline)) {
      errors.push(`fast_hook timeline must be one of: ${VALID_TIMELINES.join(", ")}`);
    }
  }
  
  return errors.length === 0
    ? { valid: true, errors: [] }
    : { valid: false, errors };
}
```

**Edge Cases:**

| Scenario | Behavior |
|----------|----------|
| Both slow_burn and fast_hook empty | ❌ REJECT |
| Timeline not in predefined set | ❌ REJECT with suggestion |
| Empty `what_draws_in` array | ✅ OK (user can add later) |
| Same timeline for slow_burn and fast_hook | ⚠️ WARN: "Unusual but allowed" |
| `depth_signal` is empty string | ✅ OK |

---

### Layer 4: Engagement Curve & Cooperation Style

**Rules:**
- At least one phase must be present (phase_1, phase_2, or phase_3)
- Phase durations follow pattern: `phase_1` = "first message to day X", etc.
- `what_keeps_interest` and `what_sustains` are arrays (can be empty)
- Cooperation style has 3 required fields: `collaboration_mode`, `communication_rhythm`, `decision_making`

**Valid Values:**
```typescript
const COLLABORATION_MODES = ["co-created", "guided", "structured", "emergent"];
const COMMUNICATION_RHYTHMS = ["frequent", "intentional", "spacious", "adaptive"];
const DECISION_MAKINGS = ["mutual", "one-leads", "rotating", "consensus"];
```

**Validation Logic:**
```typescript
function validateEngagementCurve(curve: EngagementCurve): ValidationResult {
  const errors = [];
  
  if (!curve.phase_1 && !curve.phase_2 && !curve.phase_3) {
    errors.push("Engagement curve must have at least one phase");
  }
  
  return errors.length === 0
    ? { valid: true, errors: [] }
    : { valid: false, errors };
}

function validateCooperationStyle(style: CooperationStyle): ValidationResult {
  const errors = [];
  
  if (!COLLABORATION_MODES.includes(style.collaboration_mode)) {
    errors.push(`collaboration_mode must be one of: ${COLLABORATION_MODES.join(", ")}`);
  }
  
  if (!COMMUNICATION_RHYTHMS.includes(style.communication_rhythm)) {
    errors.push(`communication_rhythm must be one of: ${COMMUNICATION_RHYTHMS.join(", ")}`);
  }
  
  if (!DECISION_MAKINGS.includes(style.decision_making)) {
    errors.push(`decision_making must be one of: ${DECISION_MAKINGS.join(", ")}`);
  }
  
  return errors.length === 0
    ? { valid: true, errors: [] }
    : { valid: false, errors };
}
```

**Edge Cases:**

| Scenario | Behavior |
|----------|----------|
| All phases empty | ❌ REJECT |
| Only phase_1 filled | ✅ OK (they might not have long-term data) |
| Phase durations not matching pattern | ⚠️ WARN: "Phase duration format unusual" |
| Conflicting phases (phase_2 incompatible with phase_1) | ⚠️ WARN: Show UI hint |
| Cooperation style missing a field | ❌ REJECT: provide default |

---

### Layer 5: Dynamic Preferences

**Power Dynamics:**

**Rules:**
- If `enabled: false`, ignore all other power fields
- If `enabled: true`, `style` and `flexibility` should be set
- `expression_modes` is an array of enum values (from `ExpressionMode`)
- `exploration` is free text (can be empty)

**Valid Expression Modes:**
```typescript
type ExpressionMode =
  | "performative_power_play"
  | "ironic_submission_dominance"
  | "theatrical_absurdity"
  | "symbolic_transaction"
  | "meta_aware_dynamics";
```

**Validation Logic:**
```typescript
function validatePowerDynamics(power: PowerDynamics): ValidationResult {
  const errors = [];
  
  if (power.enabled) {
    if (!power.style) {
      errors.push("Power style must be set if power exchange is enabled");
    }
    
    if (!power.flexibility) {
      errors.push("Power flexibility must be set if power exchange is enabled");
    }
    
    const validModes: ExpressionMode[] = [
      "performative_power_play",
      "ironic_submission_dominance",
      "theatrical_absurdity",
      "symbolic_transaction",
      "meta_aware_dynamics"
    ];
    
    if (power.expression_modes) {
      const invalid = power.expression_modes.filter(em => !validModes.includes(em));
      if (invalid.length > 0) {
        errors.push(`Invalid expression modes: ${invalid.join(", ")}`);
      }
    }
  }
  
  return errors.length === 0
    ? { valid: true, errors: [] }
    : { valid: false, errors };
}
```

**Play Preferences:**

**Rules:**
- `mode` is one of: `"character_forward"`, `"reality_grounded"`, `"abstract"`
- `intensity_profile` values (emotional, theatrical, intellectual) are: `"low"`, `"medium"`, `"high"`
- `pacing` is one of: `"slow"`, `"moderate"`, `"fast"`

**Kink Alignment:**

**Rules:**
- `string[]` of tags (no enum, fully user-definable)
- Can include preset tags like `"power_exchange"` or custom tags
- No duplicates allowed

**Validation Logic:**
```typescript
function validateKinkAlignment(kinks: string[]): ValidationResult {
  const errors = [];
  
  const unique = new Set(kinks);
  if (kinks.length !== unique.size) {
    errors.push("Kink alignment tags must be unique");
  }
  
  const invalidChars = kinks.filter(k => /[<>"{}\[\]]/g.test(k));
  if (invalidChars.length > 0) {
    errors.push(`Invalid characters in: ${invalidChars.join(", ")}`);
  }
  
  return errors.length === 0
    ? { valid: true, errors: [] }
    : { valid: false, errors };
}
```

**Edge Cases:**

| Scenario | Behavior |
|----------|----------|
| Power enabled but style empty | ❌ REJECT |
| Power disabled but expression_modes filled | ⚠️ WARN: "These will be ignored while power is disabled" |
| Invalid expression mode | ❌ REJECT: list valid modes |
| Duplicate kink tags | ❌ REJECT: remove duplicates and retry |
| Whitespace-only kink tag | ❌ REJECT: trim and validate |
| Very long kink tag (>100 chars) | ⚠️ WARN: "Consider breaking into multiple tags" |
| Lowercase vs PascalCase consistency | ✅ OK (user choice, normalize for display) |

---

### Layer 6: Repulsion Vectors

**Rules:**
- All three arrays are optional: `hard_stops`, `yellow_flags`, `pattern_concerns`
- Each item is free text (any string allowed)
- No duplicates within each array
- Can be empty (means no specific boundaries set)

**Validation Logic:**
```typescript
function validateRepulsionVectors(vectors: RepulsionVectors): ValidationResult {
  const errors = [];
  
  const checkDuplicates = (arr: string[] | undefined, name: string) => {
    if (arr) {
      const unique = new Set(arr);
      if (arr.length !== unique.size) {
        errors.push(`${name} must not have duplicates`);
      }
    }
  };
  
  checkDuplicates(vectors.hard_stops, "hard_stops");
  checkDuplicates(vectors.yellow_flags, "yellow_flags");
  checkDuplicates(vectors.pattern_concerns, "pattern_concerns");
  
  return errors.length === 0
    ? { valid: true, errors: [] }
    : { valid: false, errors };
}
```

**Edge Cases:**

| Scenario | Behavior |
|----------|----------|
| All three arrays empty | ✅ OK (user might not want to specify) |
| Overlap between hard_stops and yellow_flags | ⚠️ WARN: "Same item in multiple categories?" |
| Duplicate within an array | ❌ REJECT: deduplicate |
| Very harsh language | ✅ OK (no censorship) |
| Vague boundaries (e.g., "bad vibes") | ✅ OK (user's choice, might suggest being specific) |

---

### Trust Profile

**Rules:**
- `harm_history` is optional, free text
- `references_available` is a boolean (not optional, defaults to false)
- If `harm_history` is provided, it should be non-empty string (not just whitespace)

**Validation Logic:**
```typescript
function validateTrustProfile(trust: TrustProfile): ValidationResult {
  const errors = [];
  
  if (trust.harm_history !== undefined && trust.harm_history !== null) {
    const trimmed = trust.harm_history.trim();
    if (trimmed === "") {
      errors.push("harm_history, if provided, must not be empty");
    }
    
    if (trimmed.length > 5000) {
      errors.push("harm_history exceeds 5000 characters");
    }
  }
  
  if (typeof trust.references_available !== "boolean") {
    errors.push("references_available must be a boolean");
  }
  
  return errors.length === 0
    ? { valid: true, errors: [] }
    : { valid: false, errors };
}
```

**Edge Cases:**

| Scenario | Behavior |
|----------|----------|
| Harm history provided but references_available false | ⚠️ WARN: "You disclosed history but references unavailable. OK?" |
| Whitespace-only harm history | ❌ REJECT: trim and validate |
| Very long harm history | ⚠️ WARN: "This is quite long. Consider summary" |
| No harm history, references_available true | ✅ OK (user doesn't have past issues) |

---

### Discovery Introduction

**Rules:**
- `written_bio` is optional, free text (no length limit enforced, but UI might limit to 500 chars)
- `audio_intro` and `video_intro` are optional URLs (must be valid Supabase bucket URLs)
- `willing_to_have_compatibility_shared` is boolean (defaults to false)
- If audio/video URLs provided, they should be publicly accessible

**Validation Logic:**
```typescript
function validateDiscoveryIntroduction(intro: DiscoveryIntroduction): ValidationResult {
  const errors = [];
  
  const isSupabaseUrl = (url: string): boolean => {
    return url.includes("supabase") && (url.startsWith("http://") || url.startsWith("https://"));
  };
  
  if (intro.audio_intro && !isSupabaseUrl(intro.audio_intro)) {
    errors.push("audio_intro must be a valid Supabase bucket URL");
  }
  
  if (intro.video_intro && !isSupabaseUrl(intro.video_intro)) {
    errors.push("video_intro must be a valid Supabase bucket URL");
  }
  
  if (typeof intro.willing_to_have_compatibility_shared !== "boolean") {
    errors.push("willing_to_have_compatibility_shared must be a boolean");
  }
  
  return errors.length === 0
    ? { valid: true, errors: [] }
    : { valid: false, errors };
}
```

**Edge Cases:**

| Scenario | Behavior |
|----------|----------|
| Bio provided but willing_to_share false | ⚠️ WARN: "You wrote a bio but don't want it shared. Move to private notes?" |
| Audio/video URL broken (404) | ❌ WARN AT SAVE: "Media file not accessible" |
| Missing audio but video provided | ✅ OK |
| Very long bio | ✅ OK (no length limit enforced server-side) |
| Media files too large | ❌ REJECT at upload: max 50MB audio, 100MB video |

---

### Original Fields (Loops, Lessons, Languages, Kinks, Type)

**Rules:**
- `loops` and `lessons` are arrays of strings (can be empty)
- `languages` is nested object with multiple optional string arrays and strings
- `kinks` is object with 5 string fields (all optional)
- `type` is object with 4 string fields (all optional)

**Validation Logic:**
```typescript
function validateLoopsAndLessons(loops: string[], lessons: string[]): ValidationResult {
  const errors = [];
  
  const checkArray = (arr: string[], name: string) => {
    if (arr) {
      const unique = new Set(arr);
      if (arr.length !== unique.size) {
        errors.push(`${name} must not have duplicates`);
      }
      
      const whitespaceOnly = arr.filter(item => item.trim() === "");
      if (whitespaceOnly.length > 0) {
        errors.push(`${name} contains empty items`);
      }
    }
  };
  
  checkArray(loops, "loops");
  checkArray(lessons, "lessons");
  
  return errors.length === 0
    ? { valid: true, errors: [] }
    : { valid: false, errors };
}

function validateLanguages(languages: Languages): ValidationResult {
  const errors = [];
  
  // Check that at least one field is filled
  const hasContent = Object.values(languages).some(v => {
    if (Array.isArray(v)) return v.length > 0;
    return v && v.trim && v.trim() !== "";
  });
  
  if (!hasContent) {
    // Not an error, just informational
  }
  
  return { valid: true, errors: [] };
}
```

**Edge Cases:**

| Scenario | Behavior |
|----------|----------|
| Duplicate loops | ❌ REJECT |
| Empty loop string | ❌ REJECT |
| All foundational fields empty | ✅ OK (sparse profile) |
| Loop longer than 1000 chars | ✅ OK (no limit enforced) |
| Languages with all fields empty | ✅ OK (user will add later) |
| Kinks with 2 fields filled, 3 empty | ✅ OK (partial profiles allowed) |

---

## Validation Workflow

### On Create

```
1. User submits form
2. Run layer-by-layer validation (parallel)
3. If any errors:
   - Show errors grouped by layer/section
   - Highlight problematic fields
   - Provide inline suggestions
   - Do NOT save
4. If all valid:
   - Save to database
   - Show success message
   - Redirect to view
```

### On Update

```
1. Load current profile
2. Merge with user changes (partial updates allowed)
3. Run validation on merged result
4. If errors:
   - Show them
   - Allow user to discard changes or fix
5. If valid:
   - Save changes
   - Update timestamps
   - Show which fields changed
```

### On Import (YAML)

```
1. Parse YAML → object
2. Run validation on full object
3. If critical errors (e.g., invalid archetype id):
   - Show error
   - Suggest field to fix
   - Do NOT import
4. If warnings (e.g., unusual pattern):
   - Import with warnings highlighted
   - Show in UI: "⚠️ This field might be unusual"
5. If all valid:
   - Import successfully
   - Show summary of what was imported
```

---

## Error Messages (User-Friendly)

### Archetype Issues

```
❌ "Archetype 'my_arch' and 'my_arch_v2' have conflicting names"
   → Suggestion: Rename one to be unique

❌ "Archetype class 'weird' is not recognized"
   → Suggestion: Use one of: classic, modern, experimental, custom

❌ "Archetype 'maid_ritual' marked as custom but uses preset name"
   → Suggestion: Rename to 'custom_maid_ritual' or uncheck 'custom'
```

### Power Dynamics Issues

```
❌ "Power exchange enabled but style is empty"
   → Suggestion: Pick a style or disable power exchange

⚠️ "expression_modes filled but power exchange is disabled"
   → These will be ignored. Enable power exchange to use them.

❌ "Invalid expression mode 'dominating'"
   → Valid options: performative_power_play, ironic_submission_dominance,
                   theatrical_absurdity, symbolic_transaction, meta_aware_dynamics
```

### Trust Profile Issues

```
⚠️ "You disclosed harm history but references are unavailable"
   → Is this intentional? You might want to enable references.

❌ "harm_history field is empty (only whitespace)"
   → If you want to disclose, write your accountability statement.
     Or leave it blank if not applicable.
```

### YAML Import Issues

```
❌ "YAML parsing failed: Invalid structure"
   → Make sure your YAML is valid. Check indentation.

⚠️ "Unknown archetype class 'future' in preset archetypes"
   → This will be imported as-is. You can edit it later.

❌ "Duplicate kink alignment tags detected: ['power_exchange', 'power_exchange']"
   → Removing duplicate. You'll see: ['power_exchange']
```

---

## Defaults & Hints (UI Text)

### When Field is Empty

```
Loops:
  [empty textarea]
  💡 Hint: "What patterns keep you interested? E.g., 'Intellectual stimulation → deeper conversation → vulnerability'"

Archetypes:
  [empty list]
  💡 Hint: "Select presets or create custom ones. These describe how you show up."

Power Expression Modes:
  [unchecked checkboxes]
  💡 Hint: "How does power show up for you? Select all that apply."

Harm History:
  [empty textarea]
  💡 Hint: "Optional. If you want to disclose past issues and accountability, write here."
```

---

## Completeness Scoring

```typescript
type CompletionLevel = 
  | "sparse"      // 0-25%: just getting started
  | "emerging"    // 25-50%: filling out sections
  | "substantial" // 50-75%: pretty complete
  | "rich";       // 75-100%: deeply detailed

function getCompletionLevel(percentage: number): CompletionLevel {
  if (percentage < 25) return "sparse";
  if (percentage < 50) return "emerging";
  if (percentage < 75) return "substantial";
  return "rich";
}
```

**UI Messaging:**

```
Sparse (0-25%):
  "You've started! Fill in foundations to get going."

Emerging (25-50%):
  "Good start! Add more detail to help people understand you."

Substantial (50-75%):
  "Really good! You could go deeper into dynamics or trust."

Rich (75-100%):
  "Beautifully detailed. You're clearly thoughtful about this."
```

---

## Data Integrity Checks (Server-Side)

### Before Save

```elixir
defmodule Woem.Resonance.ProfileValidator do
  def validate_full_profile(spec) do
    with :ok <- validate_attention_model(spec),
         :ok <- validate_archetypes(spec),
         :ok <- validate_attraction_gradient(spec),
         :ok <- validate_engagement_curve(spec),
         :ok <- validate_power_dynamics(spec),
         :ok <- validate_kink_alignment(spec),
         :ok <- validate_repulsion_vectors(spec),
         :ok <- validate_trust_profile(spec),
         :ok <- validate_discovery_introduction(spec),
         :ok <- validate_foundational_fields(spec) do
      {:ok, spec}
    else
      {:error, reason} -> {:error, reason}
    end
  end
  
  defp validate_attention_model(spec) do
    if spec.attention_model["type"] == "resonance_not_persuasion" do
      :ok
    else
      {:error, "Invalid attention model type"}
    end
  end
  
  # ... more validators
end
```

### Uniqueness Constraints (DB)

```sql
-- Ensure no duplicate archetype IDs within a profile
ALTER TABLE resonance_specs
ADD CONSTRAINT unique_archetype_ids_per_spec
CHECK (
  (SELECT COUNT(DISTINCT archetype_id) 
   FROM jsonb_to_recordset(archetypes) AS x(id text)) 
  = jsonb_array_length(archetypes)
);
```

---

## Recovery & Rollback

### If Validation Fails During Save

```
1. Transaction rolls back
2. User sees error message
3. Form retains their input (don't lose data!)
4. User can:
   - Fix the issue and retry
   - Save as draft (optional feature)
   - Discard changes
```

### If YAML Import Fails

```
1. Parse error → show which line is problematic
2. Validation error → show which field is invalid
3. User can:
   - Edit YAML and retry
   - Cancel and start fresh
   - Load backup (if available)
```

---

## Migration Path for Schema Changes

### If we add new expression modes later

```
OLD: ["performative_power_play", "ironic_submission_dominance"]
ADD: "consensual_objectification"

MIGRATION:
  - New mode goes into enum
  - Old profiles still valid
  - Old expression_modes still show up
  - UI offers to add new modes on edit
```

### If we deprecate a field

```
OLD: "flexibility: rigid_or_fluid"
NEW: "flexibility: fluid_roles" (single value instead of choice)

MIGRATION:
  - Keep old field in schema
  - Add new field with default
  - On first load, suggest migrating
  - Export includes both (backward compat)
  - New imports only use new field
```

---

## Testing Checklist

### Validation Tests

- [ ] Each layer validates correctly with valid data
- [ ] Each layer rejects invalid data with clear error
- [ ] Sparse profiles pass validation
- [ ] Full profiles pass validation
- [ ] Partial profiles pass validation
- [ ] Empty profiles fail only if required fields missing
- [ ] YAML import validates before saving
- [ ] YAML export round-trip preserves data integrity
- [ ] Duplicate detection works (archetypes, loops, kinks, tags)
- [ ] Whitespace handling works (trim, reject empty-only strings)
- [ ] Long text fields handled gracefully (no arbitrary limits)
- [ ] Special characters in user text don't break validation
- [ ] Media URLs validated (must be Supabase bucket URLs)

### Edge Case Tests

- [ ] Very large profiles (100+ archetypes, 1000+ character kink descriptions)
- [ ] Profiles with only sparse Layer 1 data
- [ ] Profiles with no power dynamics
- [ ] Profiles with no trust profile
- [ ] Profiles with no discovery introduction
- [ ] Updates that remove all content from a section
- [ ] Imports with old schema version (backward compat)
- [ ] Concurrent edits (same user, two tabs open)
- [ ] Missing optional nested fields (graceful defaults)
