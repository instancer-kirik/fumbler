# TypeScript/YAML Sync TODO & Power Exchange Design

## Completed Analysis

### TypeScript Gaps to Sync (Priority: Sync the Gaps - Option 1)

**SafetyProfile** (add 2 fields):
```typescript
harm_history: string;           // accountability disclosure
references_available: boolean;  // vouching system
```

**DiscoveryMetadata** (add 3 fields):
```typescript
willing_to_have_compatibility_shared: boolean;
introduction: {
  written_bio: string;
  audio_intro: string | null;   // media URL
  video_intro: string | null;   // media URL
}
```

**ExperientialProfile** (add 1 field):
```typescript
kink_alignment: string[];  // tags like "power_exchange", "transactional_intimacy", etc.
```

**Implementation Steps:**
1. Update interfaces in `src/data/resonance-profile.ts`
2. Update default objects (defaultExperiential, defaultSafety, defaultConnection)
3. Expose fields in ResonanceEditor UI
4. Display fields in ResonanceProfileView (when unlocked by relationship level)
5. Test YAML round-trip import/export

---

## Power Exchange Design Exploration

### Current YAML Structure (in experiential_profile)

```yaml
experiential_profile:
  kink_alignment:
    - "power_exchange"
    - "transactional_intimacy"
    - "financial_asymmetry_as_play"

  kinks:
    intellectual: "being_challenged_and_pushed_intellectually"
    relational: "full_attention_and_presence"
    intensity: "high_but_safe"
    play: "exploring_edges_together"
    avoid: "performance_without_authenticity"
```

### The Core Tension

Traditional BDSM frameworks use role archetypes (Dom, sub, switch). But this conflicts with Resonance's philosophy of "fluid, conversational, emergent alignment." You've identified the right problem: **roles slot in AFTER everything else, and they're prescriptive.**

### The Insight: Invert the Framework

Instead of starting with role labels, **start with how power shows up in practice:**

```yaml
power_exchange:
  style: "fluid_and_conversational"
  not: "rigid_roles_or_scripts"

expression_modes:
  - performative_power_play      # knowing it's a game, leaning into it
  - ironic_submission_dominance  # playing with the idea without taking it literally
  - theatrical_absurdity         # humor & exaggeration as the point
  - symbolic_transaction         # the exchange itself has meaning, not literal power
  - meta_aware_dynamics          # discussing the dynamic while in it

dynamic_context:
  flexibility: "fluid_roles"
  shifts_based_on: 
    - mood
    - who_we_are_that_day
    - what_the_interaction_needs
```

### Key Design Decisions

**1. kink_alignment is tags, not identity**
- `power_exchange` is something you align with, not a role you play
- It coexists with other alignments: `transactional_intimacy`, `financial_asymmetry_as_play`, etc.
- Tags are searchable/discoverable without forcing categorization

**2. expression_modes describe HOW power appears**
- Not role labels, but behavioral/relational signatures
- Multiple modes can coexist in one person
- They're dynamic and contextual, not fixed identities

**3. kinks section stays separate but connected**
- `intellectual`, `relational`, `intensity`, `play`, `avoid` are about flavor
- These can inform power exchange (e.g., intellectual challenge + power play = very different vibe)
- But don't conflate kink preference with power dynamic style

**4. Roles become emergent, not prescribed**
- If you describe yourself as: "performative power play + high intensity + ironic submission"
- Someone reading that understands your vibe without you claiming a label
- Compatible matches can find you through expression_modes tags
- If they want to slot into "Dom/sub" language, fine—that emerges from compatibility

### What This Solves

✅ Avoids rigid role prescriptions
✅ Accounts for irony, meta-awareness, absurdity
✅ Captures contextual fluidity
✅ Still searchable and discoverable
✅ Lets people express complexity without needing a taxonomy

### Open Questions to Resolve

1. **Should expression_modes be in dynamic_preferences, or top-level in kinks section?**
   - Current lean: top-level in `experiential_profile` alongside `kink_alignment`
   - Rationale: It's about how you experience power, not just preference

2. **Do we need a freeform "power_dynamic_exploration" text field?**
   - For people who want to say: "I'm still figuring this out" or "It's complicated"
   - Prevents binary thinking

3. **How does intensity_level interact with power_exchange?**
   - `high_but_safe` vs. `performative_power_play` are orthogonal
   - Need to ensure UI makes this distinction clear

4. **Compatibility matching across expression_modes:**
   - "performative + ironic" might find "theatrical_absurdity" attractive
   - "symbolic_transaction" might seek "ironic_submission_dominance"
   - This is data for the matching algorithm later

### Next Implementation

Build this into:
1. ExperientialProfile interface in TypeScript
2. ResonanceEditor form UI with expression_modes checkboxes
3. ResonanceProfileView rendering these tags contextually
4. Search/discovery treating `expression_modes` as filterable tags

---

## Power Exchange TypeScript Implementation

### Updated ExperientialProfile Interface

```typescript
export interface ExperientialProfile {
  loops: string[];
  lessons: string[];
  languages: {
    receiveLoveThrough: string[];
    expressLoveThrough: string[];
    communicationStyle: string;
    creativeExpression: string[];
    vulnerabilityLanguage: string;
  };
  
  // ADDED: Kink alignment tags (searchable, non-prescriptive)
  kinkAlignment: string[];
  
  // ADDED: How power dynamics show up in practice
  powerExchange?: {
    enabled: boolean;
    expressionModes: (
      | "performative_power_play"
      | "ironic_submission_dominance"
      | "theatrical_absurdity"
      | "symbolic_transaction"
      | "meta_aware_dynamics"
    )[];
    style: "fluid_and_conversational"; // future: could be enum if variants emerge
    flexibility: "fluid_roles";
    exploration?: string; // freeform: "still figuring this out", etc.
  };
  
  kinks: {
    intellectual: string;
    relational: string;
    intensity: string;
    play: string;
    avoid: string;
  };
  type: {
    archetype: string;
    attractionPattern: string;
    roleInRelationship: string;
    recurringPattern: string;
  };
}
```

### YAML Mapping Reference

```yaml
experiential_profile:
  kink_alignment: ["power_exchange", "transactional_intimacy", ...]
  
  power_exchange:
    enabled: true
    expression_modes:
      - performative_power_play
      - ironic_submission_dominance
      - theatrical_absurdity
      - symbolic_transaction
      - meta_aware_dynamics
    style: fluid_and_conversational
    flexibility: fluid_roles
    exploration: "description of how I experience power"
    
  kinks:
    intellectual: "..."
    relational: "..."
    intensity: "..."
    play: "..."
    avoid: "..."
```

### Why This Design

1. **kinkAlignment as tags**: Searchable, composable, not identity-binding
2. **powerExchange as optional sub-object**: Only populated if someone engages with power dynamics
3. **expressionModes as enum union**: Bounded list prevents taxonomy sprawl while allowing multiple selections
4. **flexibility + exploration**: Captures both structure and ambiguity
5. **Orthogonal to other kink preferences**: You can have `power_exchange` + `intense_intellectual_play` without them interfering

### Editor UI Pattern

```
┌─ Experiential Profile
│
├─ [existing sections: loops, lessons, languages, kinks, type...]
│
└─ Power Exchange (optional)
   ├─ ☐ Enabled
   │
   ├─ Expression Modes (select all that apply):
   │  ☐ Performative power play (knowing it's a game, leaning into it)
   │  ☐ Ironic submission/dominance (playing without taking literally)
   │  ☐ Theatrical absurdity (humor & exaggeration as the point)
   │  ☐ Symbolic transaction (the exchange itself has meaning)
   │  ☐ Meta-aware dynamics (discussing the dynamic while in it)
   │
   ├─ Kink Alignment Tags:
   │  [power_exchange] [transactional_intimacy] [financial_asymmetry_as_play] [+ add]
   │
   └─ How you explore this (optional):
      [text field: "I'm still figuring this out", "very contextual", etc.]
```

### Compatibility Signal

When matching, algorithm can:
- Find people with overlapping `expressionModes`
- Respect `flexibility: "fluid_roles"` as a signal they're not seeking fixed positioning
- Use `kinkAlignment` tags for discoverability without forcing taxonomy
- Surface the `exploration` field when depth increases (for transparency)