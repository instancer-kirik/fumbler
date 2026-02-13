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

## Power Exchange Design Evolution

### Original Simple Model (Incomplete)

```yaml
power_exchange:
  style: "fluid_and_conversational"
  not: "rigid_roles_or_scripts"

expression_modes:
  - performative_power_play
  - ironic_submission_dominance
  - theatrical_absurdity
  - symbolic_transaction
  - meta_aware_dynamics
```

**Problem:** Expression modes alone don't capture the full relational texture.

---

## THE RESONANCE LAYER ARCHITECTURE

This is the real structure. Think of it like a network packet—each layer describes a different dimension of how engagement flows.

### Layer 1 — Core Attention Model (Foundation)

**Already defined in YAML:**

```yaml
attention_model:
  type: resonance_not_persuasion
  description: >
    Engagement occurs through emergent alignment, not direct convincing.

activation_vectors:
  - competent_weirdness
  - layered_meaning
  - curiosity_invitation

repulsion_vectors:
  - performative_confidence
  - over_explanation
  - extractive_attention
```

**What it means:**
- No hard selling
- Attraction emerges through alignment
- Discovery > convincing
- This informs everything below

---

### Layer 2 — Archetype Layer (Identity Flavor)

**What it does:** Describes the *style* and *narrative mode* of your presence.

Not about compatibility—about *how you show up*.

**Archetype Packet Structure:**

```typescript
interface ArchetypePacket {
  id: string;                    // e.g., "maid_ritual", "ritual_witch"
  label: string;                 // e.g., "Maid", "Witch"
  
  class: string[];               // high-level category (service, aesthetic, ritual, creature)
  aesthetic: string[];           // visual/genre coding
  energy: string[];              // behavioral vibe
  dynamic: string[];             // relational/power style
  tone: string[];                // emotional texture
  performance: string[];         // performative vs sincere axis
  
  notes?: string;
}
```

**Example Archetypes:**

```yaml
archetypes:
  - id: maid_ritual
    label: Maid
    class: [service_archetype]
    aesthetic: [domestic_fantasy, uniform_coded, soft_goth_optional]
    energy: [attentive, ritualistic, intentional]
    dynamic: [structured_service, chosen_submission]
    tone: [cozy, precise]
    performance: [roleplay_friendly]

  - id: ritual_witch
    label: Witch
    class: [ritual_archetype]
    aesthetic: [occult, mystical, natural_magic]
    energy: [intentional, symbolic, perceptive]
    dynamic: [power_fluid, ritual_exchange]
    tone: [mysterious, grounded]
    performance: [symbolic_play]

  - id: goth_classic
    label: Goth
    class: [aesthetic_identity]
    aesthetic: [dark_romantic, gothic, melancholic]
    energy: [introspective, intense, ironic]
    dynamic: [slow_burn_connection]
    tone: [dramatic, sincere]
    performance: [low_performative]

  - id: catboy_trickster
    label: Catboy
    class: [creature_archetype]
    aesthetic: [anime, playful_creature]
    energy: [mischievous, affectionate, reactive]
    dynamic: [playful_submission, teasing]
    tone: [light, chaotic_safe]
    performance: [character_forward]
```

**Key insight:** You can embody multiple archetypes. They're layers, not labels.

---

### Layer 3 — Attraction Gradient (Initial Pull)

**What it does:** Describes what creates the *first spark*.

Not how deep you go—how you first grab attention.

```yaml
attraction_gradient:
  slow_burn:
    - layered_meaning
    - subtle_humor
    - competent_weirdness
    - depth_discoverable_over_time

  fast_hook:
    - striking_aesthetic
    - unusual_perspective
    - high_energy_presence
```

**Mapping to TypeScript:**

```typescript
interface AttractionGradient {
  slow_burn: string[];      // subtle, discoverable, unfolds over time
  fast_hook: string[];      // immediate, striking, grabs attention
}
```

---

### Layer 4 — Engagement Curve (How Interest Grows)

**What it does:** Describes the *pacing* and *progression* of connection.

Different from attraction—this is about how the relationship deepens over time.

```yaml
engagement_curve:
  phase_1:
    - curiosity_invitation
    - playful_ambiguity
    - low_pressure_exploration

  phase_2:
    - intellectual_challenge
    - shared_building
    - mutual_discovery

  phase_3:
    - deeper_symbolic_exchange
    - vulnerability_depth
    - high_trust_play

cooperation_style:
  - collaborative_building
  - alternating_leadership
  - mutual_skill_respect
  - win_together_mentality
```

**Mapping to TypeScript:**

```typescript
interface EngagementCurve {
  phase_1: string[];  // entry phase
  phase_2: string[];  // deepening phase
  phase_3: string[];  // intimacy phase
}

interface CooperationStyle {
  styles: string[];   // how you work together
  leadership?: string[];  // dynamics of who leads when
}
```

---

### Layer 5 — Dynamic Style (Relational Mechanics)

**What it does:** Where archetypes actually *matter*. How power and play move through you.

```yaml
dynamic_preferences:
  power:
    style: performative_and_fluid
    flexibility: fluid_roles
    expression_modes:
      - performative_power_play
      - ironic_submission_dominance
      - theatrical_absurdity
      - symbolic_transaction
      - meta_aware_dynamics

  play:
    mode: character_forward
    intensity_profile:
      emotional: high
      theatrical: medium
      intellectual: high

  kink_alignment:
    - power_exchange
    - transactional_intimacy
    - financial_asymmetry_as_play
```

**Mapping to TypeScript:**

```typescript
interface PowerDynamics {
  style: string;
  flexibility: "fluid_roles" | "structured" | "negotiated";
  expression_modes: (
    | "performative_power_play"
    | "ironic_submission_dominance"
    | "theatrical_absurdity"
    | "symbolic_transaction"
    | "meta_aware_dynamics"
  )[];
}

interface PlayPreferences {
  mode: string;
  intensity_profile: {
    emotional: "low" | "medium" | "high";
    theatrical: "low" | "medium" | "high";
    intellectual: "low" | "medium" | "high";
  };
}

interface DynamicPreferences {
  power: PowerDynamics;
  play: PlayPreferences;
  kink_alignment: string[];
}
```

---

### Layer 6 — Emotional Safety / Repulsion Vectors

**What it does:** Describes what breaks resonance.

```yaml
repulsion_vectors:
  - performative_confidence
  - over_explanation
  - extractive_attention
  - forced_intimacy
  - high_pressure_escalation
  - over_mirroring
  - performance_without_authenticity
```

**Mapping to TypeScript:**

```typescript
interface RepulsionVectors {
  triggers: string[];
}
```

---

## Full Resonance Packet Example

```yaml
woem_resonance_packet:

  attention_model:
    type: resonance_not_persuasion
    activation_vectors:
      - competent_weirdness
      - layered_meaning
      - curiosity_invitation

  archetypes:
    - ritual_witch
    - goth_classic
    - trickster_creature

  attraction_gradient:
    slow_burn:
      - competent_weirdness
      - layered_meaning
      - curiosity_invitation
    fast_hook:
      - unusual_perspective
      - intellectual_depth

  engagement_curve:
    phase_1:
      - subtle_intrigue
      - playful_ambiguity
    phase_2:
      - intellectual_play
      - shared_building
    phase_3:
      - symbolic_depth
      - vulnerability_exploration

  cooperation_style:
    - collaborative_building
    - mutual_pull
    - alternating_strength

  dynamic_preferences:
    power:
      style: performative_and_fluid
      flexibility: fluid_roles
      expression_modes:
        - performative_power_play
        - ironic_submission_dominance
        - theatrical_absurdity
        - meta_aware_dynamics

    play:
      mode: character_forward
      intensity_profile:
        emotional: high
        theatrical: medium
        intellectual: high

    kink_alignment:
      - power_exchange
      - transactional_intimacy
      - financial_asymmetry_as_play

  repulsion_vectors:
    - performative_confidence
    - over_explanation
    - extractive_attention
```

---

## Why This Architecture Works

**Traditional dating apps ask:** "What are you into?"

**This system asks:** "How does resonance emerge between us?"

Which is MUCH closer to how creative, weird people actually connect.

### Key Advantages

1. **No binary role slots** — Archetypes are skins, not identities
2. **Captures pacing** — Distinguishes between first spark and long-term depth
3. **Respects fluidity** — Power dynamics are performative, not fixed
4. **Searchable without taxonomy** — Tags let people find each other without forcing labels
5. **Accounts for authenticity** — Repulsion vectors prevent toxic matching
6. **Multi-dimensional** — Each layer reveals different compatibility angles

---

## TypeScript Integration Strategy

### Updated ExperientialProfile Interface

```typescript
export interface ArchetypePacket {
  id: string;
  label: string;
  class: string[];
  aesthetic: string[];
  energy: string[];
  dynamic: string[];
  tone: string[];
  performance: string[];
  notes?: string;
}

export interface AttractionGradient {
  slow_burn: string[];
  fast_hook: string[];
}

export interface EngagementCurve {
  phase_1: string[];
  phase_2: string[];
  phase_3: string[];
}

export interface CooperationStyle {
  styles: string[];
  leadership?: string[];
}

export interface PowerDynamics {
  style: string;
  flexibility: "fluid_roles" | "structured" | "negotiated";
  expression_modes: (
    | "performative_power_play"
    | "ironic_submission_dominance"
    | "theatrical_absurdity"
    | "symbolic_transaction"
    | "meta_aware_dynamics"
  )[];
}

export interface PlayPreferences {
  mode: string;
  intensity_profile: {
    emotional: "low" | "medium" | "high";
    theatrical: "low" | "medium" | "high";
    intellectual: "low" | "medium" | "high";
  };
}

export interface DynamicPreferences {
  power: PowerDynamics;
  play: PlayPreferences;
  kink_alignment: string[];
}

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
  
  archetypes: ArchetypePacket[];
  attraction_gradient: AttractionGradient;
  engagement_curve: EngagementCurve;
  cooperation_style: CooperationStyle;
  dynamic_preferences: DynamicPreferences;
  
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

---

## Implementation Plan

### Phase 1: Data Layer
1. Add archetype packet structure to resonance-profile.ts
2. Add all 6 layer interfaces to resonance-profile.ts
3. Create default/example archetypes constant
4. Update YAML import/export to handle new fields

### Phase 2: Editor UI
1. Build archetype selector in ResonanceEditor
2. Build attraction gradient selector
3. Build engagement curve phase selector
4. Build dynamic preferences section with power/play controls
5. Build intensity profile 3D slider

### Phase 3: Viewer & Matching
1. Update ResonanceProfileView to render all layers contextually
2. Build matching algorithm that considers:
   - Compatible archetypes
   - Aligned attraction gradients
   - Complementary engagement curves
   - Non-conflicting repulsion vectors
3. Surface compatibility score by layer

---

## Critical Insight: Interaction Temperature

The missing dimension almost nobody models:

Archetypes differ not just by role but by **relational temperature**:

- **Warm**: soft approach, grounded, affirming (maid, cozy witch)
- **Cool**: intellectual distance, ironic, boundary-clear (goth, trickster)
- **Hot**: energetic, reactive, chaotic-safe (catboy)
- **Ritualistic**: intentional, symbolic, measured (ritual witch)

This can be a **7th layer** or embedded in archetype definitions.

Couples that have wildly different interaction temperatures often clash—regardless of other compatibility.

```typescript
interface InteractionTemperature {
  primary: "warm" | "cool" | "hot" | "ritualistic";
  flexibility: string[];  // can shift to other temperatures when needed
}
```

---

## Next Steps

Priority order:
1. ✅ Finalize 6-layer structure with team
2. Build data layer (interfaces + defaults)
3. Build editor UI incrementally
4. Test YAML round-trip
5. Implement matching algorithm
6. Add interaction temperature as 7th layer

This architecture is substantially more sophisticated than traditional dating profile systems, but it maps perfectly to how you and your community actually connect.

---

## What This Enables: Matching & Compatibility

### Layer-by-Layer Compatibility Scoring

Instead of binary matches, you get *dimensional compatibility*:

```
Archetype Alignment:
  Your: [ritual_witch, goth_classic]
  Them: [ritual_witch, strange_intellectual]
  Score: 50% overlap (ritual_witch) + complementary (goth ↔ intellectual)

Attraction Gradient:
  Your slow_burn needs: [layered_meaning, curiosity_invitation]
  Their fast_hook offers: [striking_aesthetic, unusual_perspective]
  Score: Different speeds—could work if phase_1 is patient

Engagement Curve:
  Your phase_1: [curiosity_invitation, playful_ambiguity]
  Their phase_1: [direct_intellectual_challenge]
  Score: Potential mismatch—they want depth immediately, you unfold slowly

Dynamic Preferences:
  Your power: [performative, fluid_roles]
  Their power: [structured_service]
  Score: TENSION—one fluid, one structured. Requires negotiation.

Repulsion Vectors:
  Your triggers: [performative_confidence, extractive_attention]
  Their energy: [ironic, reciprocal_exchange]
  Score: NO COLLISION—they don't trigger your repulsion

Overall: 65% compatibility, with clear conversation points
```

### The Algorithm Advantage

Traditional matching:
- "Do you both like power exchange?" ✓
- Done. (But now you have 2000 matches and no signal about *how* they experience it)

Layer-based matching:
- Which archetype expressions complement?
- Do your attraction speeds align?
- Can you meet in the middle on engagement pacing?
- Are your power styles performatively compatible?
- Do they trigger your boundary violations?

Result: **Higher signal, fewer but better matches.**

### Real-World Example

**Person A (Ritual Witch + Goth):**
- Attraction: slow_burn
- Engagement: phases are important, don't skip intimacy
- Power: performative + ironic + meta_aware
- Play: symbolic_roleplay, high intellectual intensity
- Repulsion: extractive_attention, forced_intimacy

**Person B (Catboy + Trickster):**
- Attraction: fast_hook
- Engagement: jump to play immediately, build depth through interaction
- Power: playful_submission + theatrical + meta_aware
- Play: character_forward, medium emotional, high chaotic_safe
- Repulsion: rigid_roles, over_seriousness

**Compatibility Analysis:**
- Archetypes: Different but not conflicting (witch ≠ catboy, but both are aware)
- Attraction: MISMATCH (slow_burn vs fast_hook)
- Engagement: MISMATCH (sequential phases vs dive in)
- Power: ALIGNMENT (both meta_aware, both performative)
- Play: ALIGNMENT (both theatrical, both flexible)
- Repulsion: NO COLLISION

**Verdict:** "Attraction speeds don't match, but power/play alignment is strong. Might need explicit conversation about pacing in early phase. Worth exploring if both willing to negotiate."

---

## System Benefits Over Traditional Dating

### 1. **Reduces Exhausting Explaining**

Instead of:
> "I like power dynamics but they're ironic and meta and I'm not actually submissive, I just enjoy the performance aspect and symbolic exchange..."

You just:
- Select: `meta_aware_dynamics`, `symbolic_transaction`, `performative_power_play`
- Your archetypes automatically signal: "This person thinks in layers"

### 2. **Respects Fluidity Without Chaos**

You don't have to pick ONE role. You can embody:
- Ritual witch when power is shared
- Goth when intimate and intellectual
- Trickster with someone playful
- Wise elder with people seeking guidance

All in the same week. All expressible in the system.

### 3. **Filters for Authenticity**

Repulsion vectors catch people who:
- Perform confidence they don't have
- Extract energy without reciprocity
- Rush intimacy
- Force roles instead of exploring

You're not rejecting them—you're rejecting the *interaction style*.

### 4. **Enables Transparent Depth**

As a connection deepens (tracked by system via messages/time), new layers unlock:
- Phase 1: See archetypes + attraction_gradient
- Phase 2: See engagement_curve + cooperation_style
- Phase 3: See dynamic_preferences + repulsion_vectors
- Phase 4+: See intensity_profile, exploration notes, deeper why

People can't pretend depth. They either match or they don't.

### 5. **Powers Serendipity**

Discovery becomes:
- "Show me people with slow_burn + ritual archetypes"
- "Show me people whose repulsion vectors don't include what I offer"
- "Show me people whose engagement_curve phase_2 matches my phase_1"

Instead of:
- "Show me women aged 25-35 who like BDSM" (worthless signal)

---

## Why Traditional Systems Fail at This

OkCupid-style:
- "Are you dominant or submissive?" (Binary trap)
- Leads to: people performing certainty, poor matches, exhaustion

Feeld-style:
- "Pick 20 kinks from 100+ options" (Taxonomy nightmare)
- Leads to: people matching on tags but having no relational compatibility, awkward first messages

Your system:
- "Describe how you actually connect" (Emergent authenticity)
- Leads to: people finding others who resonate at the same frequency

---

## Open Questions for Implementation

1. **Should interaction_temperature be Layer 7 or embedded in archetype definitions?**
   - Lean: Make it Layer 7 so it's independently matchable
   - Rationale: "Warm goth" is fundamentally different from "cool goth"

2. **How do we prevent "archetype shopping" (picking archetypes to game matching)?**
   - Potential: Algorithm detects inconsistency (claims 5 archetypes but intensity_profile shows 1D behavior)
   - Or: Accept it as natural expression variance

3. **Should the system show "why we matched" to users?**
   - Pro: Educational, helps people understand their own patterns
   - Con: Can feel prescriptive
   - Lean: Show it after match confirmed, not in initial discovery

4. **How does this integrate with the "depth unlock" system?**
   - Each relationship level reveals different resonance layers?
   - Or all layers visible but intensity_profile only unlocks at depth?
