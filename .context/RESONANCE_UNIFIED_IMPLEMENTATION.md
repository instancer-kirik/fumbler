# Resonance Profile Unified Implementation Guide

## Overview

This document provides the complete implementation plan for integrating the unified resonance profile system that combines **GAPS_AND_POWER_EXCHANGE** and **DYNAMIC_PREFERENCES** into production.

The key principle: **sparse-first with sensible defaults**, allowing profiles to grow from minimal to richly detailed over time.

---

## Architecture Summary

### The 6-Layer Resonance Model

| Layer | Purpose | Sparse Start | Full State |
|-------|---------|--------------|-----------|
| **1. Attention Model** | Foundation: what draws you | `type: "resonance_not_persuasion"` | + activation/repulsion vectors |
| **2. Archetypes** | Identity flavor | Empty `[]` | Multiple custom + preset archetypes |
| **3. Attraction Gradient** | Initial pull | `slow_burn` stub | Both slow_burn and fast_hook |
| **4. Engagement Curve** | Interest growth phases | `phase_1` only | All three phases + cooperation style |
| **5. Dynamic Preferences** | Relational mechanics | Power disabled, empty play | Full power dynamics + play + kinks |
| **6. Repulsion Vectors** | Safety boundaries | Empty arrays | Hard stops, yellow flags, patterns |

### Supporting Layers

| Layer | Purpose | Status |
|-------|---------|--------|
| **Trust Profile** | Accountability + vouching | Optional, sensitive visibility |
| **Discovery Introduction** | Bio, audio, video intros | Optional, gated by user choice |
| **Original Fields** | Loops, lessons, languages, kinks, type | Always present, foundational |

---

## Database Schema Changes (Ash Resource)

### Update `ResonanceSpec` Resource

The current `resonance_spec.ex` resource needs to expand to handle all new layers. Rather than flat attributes, we'll use nested maps (JSON) for each layer.

**New attributes to add:**

```elixir
# Layer 1
attribute :attention_model, :map do
  default %{"type" => "resonance_not_persuasion"}
  public? true
end

# Layer 2
attribute :archetypes, {:array, :map} do
  default []
  public? true
end

# Layer 3
attribute :attraction_gradient, :map do
  default %{}
  public? true
end

# Layer 4
attribute :engagement_curve, :map do
  default %{}
  public? true
end

attribute :cooperation_style, :map do
  default %{}
  public? true
end

# Layer 5
attribute :dynamic_preferences, :map do
  default %{}
  public? true
end

# Layer 6
attribute :repulsion_vectors, :map do
  default %{}
  public? true
end

# Trust & Discovery
attribute :trust_profile, :map do
  default %{}
  public? true
end

attribute :discovery_introduction, :map do
  default %{}
  public? true
end

# Original foundational fields (keep existing)
# loops, lessons, languages, kinks, type
```

### Migration Strategy

1. **Add new columns** via Ash migration
2. **Backfill defaults** (all new columns get empty maps/arrays)
3. **Validate round-trip** (YAML import/export still works)
4. **Update YAML serializer** to handle all new fields

---

## TypeScript Integration

### File: `woem/assets/ts/resonance-profile.ts`

✅ **Already created** with:
- All 6 layers fully typed
- Default factories for sparse initialization
- Sensible null/undefined handling
- `computeInteractionTemperature()` for derived signals
- `matches()` for discovery filtering
- `getProfileCompletionPercentage()` for UI hints

### Key Points

**Sparse initialization:**
```typescript
const newProfile = createDefaultExperientialProfile();
// All fields present but mostly empty/false/[]
```

**Optional fields:** All layers optional except `attention_model` (foundation)

**User-customizable archetypes:** Each can be marked `custom: true`

**Media storage:** Audio/video intros store Supabase bucket URLs

---

## YAML Schema

### Complete Valid YAML Example

```yaml
meta:
  version: "0.2"
  mode: "experiential_profile"
  name: "Woem Profile"
  created_at: "2024-01-15T10:30:00Z"

# LAYER 1: Foundation
attention_model:
  type: "resonance_not_persuasion"
  description: "I'm drawn by authentic resonance, not pressure"
  activation_vectors:
    - "intellectual challenge"
    - "playful irreverence"
  repulsion_vectors:
    - "rigid expectations"
    - "performance demands"

# LAYER 2: Identity Flavor
archetypes:
  - id: "pastel_goth"
    label: "Pastel Goth"
    class: "modern"
    aesthetic:
      - "pastel"
      - "gothic"
      - "whimsical dark"
    energy: "haunting softness"
    dynamic: "mysterious yet approachable"
    tone: "cute but eerie"
    performance: "contradiction as art"
  
  - id: "custom_midnight_scholar"
    label: "Midnight Scholar"
    class: "custom"
    custom: true
    aesthetic:
      - "late night"
      - "intellectual"
      - "slightly disheveled"
    energy: "focused intensity"
    dynamic: "conversationally intimate"
    tone: "earnest and curious"
    performance: "present in dialogue"

# LAYER 3: Attraction Gradient
attraction_gradient:
  slow_burn:
    what_draws_in:
      - "sustained intellectual conversation"
      - "shared sense of absurdity"
      - "gradual vulnerability"
    timeline: "weeks to months"
    depth_signal: "willingness to revisit conversations"
  
  fast_hook:
    what_hooks_immediately:
      - "witty irreverence"
      - "authentic self-deprecation"
      - "unexpected depth"
    timeline: "minutes to hours"
    sustain_needs: "continued authenticity"

# LAYER 4: Engagement Curve
engagement_curve:
  phase_1:
    duration: "first message to day 3"
    what_keeps_interest:
      - "responsive, playful banter"
      - "signs of genuine curiosity"
      - "willingness to go weird"
    signal_to_continue: "asking questions that show they listened"
  
  phase_2:
    duration: "days 4-7"
    depth_shift: "moving from playful to vulnerable"
    vulnerability_marker: "sharing something that matters"
  
  phase_3:
    duration: "week 2+"
    commitment_signal: "showing up consistently"
    what_sustains:
      - "deepening understanding"
      - "shared inside jokes"
      - "reliability"

cooperation_style:
  collaboration_mode: "co-created"
  communication_rhythm: "intentional"
  decision_making: "mutual"

# LAYER 5: Dynamic Preferences
dynamic_preferences:
  power:
    enabled: true
    style: "performative_and_fluid"
    flexibility: "fluid_roles"
    expression_modes:
      - "performative_power_play"
      - "ironic_submission_dominance"
      - "meta_aware_dynamics"
    exploration: "I experience power as playful conversation, not rigid structure"
  
  play:
    mode: "character_forward"
    intensity_profile:
      emotional: "high"
      theatrical: "medium"
      intellectual: "high"
    preferred_setting: "intimate but playful"
    pacing: "moderate"
  
  kink_alignment:
    - "power_exchange"
    - "transactional_intimacy"
    - "intellectual_domination"
    - "playful_vulnerability"

# LAYER 6: Repulsion Vectors
repulsion_vectors:
  hard_stops:
    - "cruelty without consent"
    - "ignoring stated boundaries"
    - "dishonesty about intention"
  
  yellow_flags:
    - "tendency to take themselves very seriously"
    - "rigidity about how things 'should' be"
  
  pattern_concerns:
    - "history of leaving abruptly"
    - "inability to discuss conflict"

# Trust & Safety
trust_profile:
  harm_history: "I've made mistakes in the past around communication. I've done accountability work and prioritize transparency now."
  references_available: true

# Discovery
discovery_introduction:
  written_bio: "Midnight scholar, pastel goth in spirit. Loves power dynamics as conversation, not scripture. Endlessly curious about how desire works."
  audio_intro: "https://supabase.example.com/storage/v1/object/public/introductions/woem_audio_intro.mp3"
  video_intro: "https://supabase.example.com/storage/v1/object/public/introductions/woem_video_intro.mp4"
  willing_to_have_compatibility_shared: true

# ORIGINAL FOUNDATIONAL FIELDS
loops:
  - "intellectual stimulation → deeper conversations → vulnerability → intimacy"
  - "playfulness → trust → willingness to explore edges together"

lessons:
  - "Power dynamics work best when discussed, not assumed"
  - "Authenticity beats performance every time"
  - "Absence of 'no' is not presence of 'yes'"

languages:
  receiveLoveThrough:
    - "deep conversation"
    - "consistent presence"
    - "playful irreverence"
  
  expressLoveThrough:
    - "intellectual engagement"
    - "creating space for vulnerability"
    - "showing up reliably"
  
  communicationStyle: "direct, playful, emotionally honest"
  
  creativeExpression:
    - "written dialogue"
    - "finding humor in contradiction"
    - "building shared worlds"
  
  vulnerabilityLanguage: "gradual disclosure, earned trust"

kinks:
  intellectual: "being challenged intellectually while emotionally close"
  relational: "full presence and genuine curiosity"
  intensity: "high but always with consent and laughter"
  play: "exploring edges together, collaborative discovery"
  avoid: "performance without authenticity, rigid roleplay"

type:
  archetype: "Curious explorer"
  attractionPattern: "slow-burn intellectual intimacy"
  roleInRelationship: "co-creator, guide, student"
  recurringPattern: "drawn to people who think weird and feel deeply"
```

---

## YAML Serializer Updates

### Changes to `yaml_serializer.ex`

The current serializer only handles top-level fields. Update it to:

1. **Include all new layers** in `to_yaml/1`
2. **Handle nested maps** (already partially working)
3. **Add `meta.version: "0.2"`** to indicate unified schema
4. **Preserve media URLs** in discovery_introduction
5. **Skip null/empty fields** for cleaner YAML
6. **Support custom archetypes** (preserve `custom: true` flag)

**Key update:**

```elixir
def to_yaml(spec) do
  spec_map = %{
    "meta" => %{
      "version" => "0.2",
      "mode" => "experiential_profile",
      "name" => spec.name,
      "created_at" => DateTime.to_iso8601(spec.inserted_at)
    },
    # Layer 1-6
    "attention_model" => spec.attention_model,
    "archetypes" => spec.archetypes,
    "attraction_gradient" => spec.attraction_gradient,
    "engagement_curve" => spec.engagement_curve,
    "cooperation_style" => spec.cooperation_style,
    "dynamic_preferences" => spec.dynamic_preferences,
    "repulsion_vectors" => spec.repulsion_vectors,
    # Trust & Discovery
    "trust_profile" => spec.trust_profile,
    "discovery_introduction" => spec.discovery_introduction,
    # Original fields
    "loops" => spec.loops,
    "lessons" => spec.lessons,
    "languages" => spec.languages,
    "kinks" => spec.kinks,
    "type" => spec.type
  }

  spec_map
  |> Enum.reject(fn {_k, v} -> v == nil or v == %{} or v == [] end)
  |> Enum.into(%{})
  |> to_yaml_string()
end
```

### Import/Export Testing

**Critical tests:**
- [ ] Round-trip: Create profile → Export YAML → Import YAML → Same profile
- [ ] Sparse profiles: Minimal YAML imports correctly with defaults applied
- [ ] Custom archetypes: `custom: true` flag preserved through round-trip
- [ ] Media URLs: Supabase bucket URLs in discovery_introduction unchanged
- [ ] Null handling: Empty fields don't appear in YAML, reappear with defaults on import

---

## ResonanceEditor UI (LiveView)

### Form Structure: Tab-Based Navigation

```
┌─ Resonance Editor
│
├─ Tabs:
│  ├─ [Foundations] (loops, lessons, languages, kinks, type)
│  │  ├─ Loops (textarea, hints)
│  │  ├─ Lessons (textarea, hints)
│  │  ├─ Languages (multi-select, freetext)
│  │  ├─ Kinks (textarea descriptions)
│  │  └─ Type (archetype, patterns)
│  │
│  ├─ [Attention] (Layer 1)
│  │  ├─ Type: "resonance_not_persuasion" (read-only)
│  │  ├─ Description (textarea)
│  │  ├─ Activation vectors (list of tags)
│  │  └─ Repulsion vectors (list of tags)
│  │
│  ├─ [Archetypes] (Layer 2)
│  │  ├─ Preset selector (checkboxes with previews)
│  │  │  ✓ Pastel Goth [preview card]
│  │  │  ✓ Maid Ritual [preview card]
│  │  │  □ Ritual Witch
│  │  │  □ Goth Classic
│  │  │  □ Catboy Trickster
│  │  │
│  │  └─ Custom Archetype Creator
│  │     ├─ Label (text)
│  │     ├─ Class (dropdown: classic, modern, experimental, custom)
│  │     ├─ Aesthetic (tag input)
│  │     ├─ Energy (textarea)
│  │     ├─ Dynamic (textarea)
│  │     ├─ Tone (textarea)
│  │     └─ Performance (textarea)
│  │     [+ Add Custom]
│  │
│  ├─ [Attraction] (Layer 3)
│  │  ├─ Slow Burn
│  │  │  ├─ What draws in (tags)
│  │  │  ├─ Timeline (select)
│  │  │  └─ Depth signal (textarea)
│  │  │
│  │  └─ Fast Hook
│  │     ├─ What hooks immediately (tags)
│  │     ├─ Timeline (select)
│  │     └─ Sustain needs (textarea)
│  │
│  ├─ [Engagement] (Layer 4)
│  │  ├─ Phase 1 (first message to day 3)
│  │  │  ├─ What keeps interest (tags)
│  │  │  └─ Signal to continue (textarea)
│  │  │
│  │  ├─ Phase 2 (days 4-7)
│  │  │  ├─ Depth shift (textarea)
│  │  │  └─ Vulnerability marker (textarea)
│  │  │
│  │  ├─ Phase 3 (week 2+)
│  │  │  ├─ Commitment signal (textarea)
│  │  │  └─ What sustains (tags)
│  │  │
│  │  └─ Cooperation Style
│  │     ├─ Collaboration mode (select)
│  │     ├─ Communication rhythm (select)
│  │     └─ Decision making (select)
│  │
│  ├─ [Dynamics] (Layer 5)
│  │  ├─ Power Exchange
│  │  │  ├─ ☐ Enabled (checkbox)
│  │  │  │
│  │  │  ├─ [If enabled]
│  │  │  ├─ Style (select)
│  │  │  ├─ Flexibility (select)
│  │  │  ├─ Expression Modes (checkboxes)
│  │  │  │  ☐ Performative power play
│  │  │  │  ☐ Ironic submission/dominance
│  │  │  │  ☐ Theatrical absurdity
│  │  │  │  ☐ Symbolic transaction
│  │  │  │  ☐ Meta-aware dynamics
│  │  │  │
│  │  │  └─ Exploration (textarea: "I'm still figuring this out")
│  │  │
│  │  ├─ Play Preferences
│  │  │  ├─ Mode (select: character_forward, reality_grounded, abstract)
│  │  │  ├─ Intensity Profile
│  │  │  │  ├─ Emotional (select: low, medium, high)
│  │  │  │  ├─ Theatrical (select)
│  │  │  │  └─ Intellectual (select)
│  │  │  ├─ Preferred setting (textarea)
│  │  │  └─ Pacing (select)
│  │  │
│  │  └─ Kink Alignment (tag input, auto-complete)
│  │
│  ├─ [Safety] (Layer 6)
│  │  ├─ Hard Stops (list of boundaries)
│  │  ├─ Yellow Flags (list of concerns)
│  │  └─ Pattern Concerns (list of patterns to avoid)
│  │
│  ├─ [Trust] (Trust Profile)
│  │  ├─ Harm History (textarea, optional)
│  │  │  "I've made mistakes... I've done accountability work..."
│  │  │
│  │  └─ ☐ References available (checkbox)
│  │
│  └─ [Intro] (Discovery Introduction)
│     ├─ Written bio (textarea)
│     ├─ Audio intro (file upload → Supabase)
│     ├─ Video intro (file upload → Supabase)
│     └─ ☐ Willing to have compatibility shared (checkbox)
│
├─ [Save] button (validates and saves)
├─ [Cancel] button
└─ [Preview] button (shows rendered profile + completion %)
```

### Key UI Patterns

**Sparse initialization:**
- Empty tabs have placeholder text: "Empty — add items to get started"
- Each section has optional inline help/hints
- Completion percentage shown in header (e.g., "23% Complete")

**Progressive disclosure:**
- Power exchange section collapses/hides if `enabled: false`
- Discovery intro only editable if `willing_to_have_compatibility_shared: true` (future UX)

**Custom archetypes:**
- "New Custom Archetype" button in archetypes tab
- Form slides in to collect details
- User can edit/delete custom ones after creation

**Media uploads:**
- Audio/video files uploaded to Supabase bucket `introductions/`
- Show upload progress
- Preview playable in profile view
- File size limits enforced

---

## ResonanceProfileView (Display)

### Rendering Layers Contextually

```html
<!-- LAYER 1: Attention Model -->
<section class="attention-model">
  <h3>Attention Foundation</h3>
  <p>{@profile.attention_model.description}</p>
  <%= if @profile.attention_model.activation_vectors do %>
    <div class="activation-vectors">
      <strong>What draws me:</strong>
      <.badge_list items={@profile.attention_model.activation_vectors} />
    </div>
  <% end %>
</section>

<!-- LAYER 2: Archetypes -->
<section class="archetypes">
  <h3>How I Show Up</h3>
  <%= for archetype <- @profile.archetypes do %>
    <.archetype_card archetype={archetype} />
  <% end %>
</section>

<!-- LAYER 3: Attraction Gradient -->
<section class="attraction">
  <h3>How I'm Drawn</h3>
  <%= if @profile.attraction_gradient.slow_burn do %>
    <.attraction_gradient_view type="slow_burn" data={...} />
  <% end %>
  <%= if @profile.attraction_gradient.fast_hook do %>
    <.attraction_gradient_view type="fast_hook" data={...} />
  <% end %>
</section>

<!-- LAYER 4: Engagement Curve -->
<section class="engagement">
  <h3>How Connection Grows</h3>
  <.engagement_phases_timeline phases={@profile.engagement_curve} />
</section>

<!-- LAYER 5: Dynamic Preferences -->
<section class="dynamics">
  <h3>Relational Dynamics</h3>
  
  <%= if @profile.dynamic_preferences.power.enabled do %>
    <.power_dynamics_view power={@profile.dynamic_preferences.power} />
  <% end %>
  
  <.play_preferences_view play={@profile.dynamic_preferences.play} />
  
  <%= if @profile.dynamic_preferences.kink_alignment do %>
    <.kink_alignment_view kinks={@profile.dynamic_preferences.kink_alignment} />
  <% end %>
</section>

<!-- LAYER 6: Repulsion Vectors -->
<section class="boundaries">
  <h3>My Boundaries</h3>
  <.repulsion_vectors_view vectors={@profile.repulsion_vectors} />
</section>

<!-- Trust Profile (gated by relationship depth) -->
<%= if @relationship_depth >= :messaged do %>
  <section class="trust">
    <h3>Trust Signals</h3>
    <%= if @profile.trust_profile.harm_history do %>
      <div class="accountability">
        <strong>Accountability:</strong> {@profile.trust_profile.harm_history}
      </div>
    <% end %>
    <%= if @profile.trust_profile.references_available do %>
      <div class="references">
        <strong>References available upon request</strong>
      </div>
    <% end %>
  </section>
<% end %>

<!-- Discovery Introduction (if willing to share) -->
<%= if @profile.discovery_introduction.willing_to_have_compatibility_shared do %>
  <section class="discovery">
    <h3>About Me</h3>
    {@profile.discovery_introduction.written_bio}
    
    <%= if @profile.discovery_introduction.audio_intro do %>
      <audio controls>
        <source src={@profile.discovery_introduction.audio_intro} type="audio/mpeg" />
      </audio>
    <% end %>
    
    <%= if @profile.discovery_introduction.video_intro do %>
      <video controls width="320" height="240">
        <source src={@profile.discovery_introduction.video_intro} type="video/mp4" />
      </video>
    <% end %>
  </section>
<% end %>

<!-- Original Fields -->
<section class="foundations">
  <h3>My Patterns</h3>
  <.loops_view loops={@profile.loops} />
  <.lessons_view lessons={@profile.lessons} />
  <.languages_view languages={@profile.languages} />
  <.kinks_view kinks={@profile.kinks} />
  <.type_view type={@profile.type} />
</section>
```

### Visibility Gating (Future)

```elixir
defmodule WoemWeb.Components.ResonanceProfileView do
  def should_show_trust_profile?(profile, relationship_depth) do
    relationship_depth >= :messaged and profile.trust_profile != nil
  end
  
  def should_show_discovery?(profile) do
    profile.discovery_introduction.willing_to_have_compatibility_shared == true
  end
  
  def should_show_power_dynamics?(profile) do
    profile.dynamic_preferences.power.enabled == true
  end
end
```

---

## Matching & Discovery Algorithm

### DiscoveryFilter (TypeScript)

Users can filter by:
- **Archetypes:** "Show me Pastel Goths and Maid Rituals"
- **Expression modes:** "Show me people with performative power play"
- **Kink alignment:** "Show me people interested in power_exchange AND transactional_intimacy"
- **Interaction temperature:** "I want slow_burn relationships only"
- **Trust requirement:** "Show me people who've disclosed harm history"

### Matching Logic

```typescript
// In resonance-profile.ts
matches(profile: ExperientialProfile, filter: DiscoveryFilter): boolean
```

**Examples:**

```typescript
// Match archetypes
const filter: DiscoveryFilter = {
  archetypes: ["pastel_goth", "ritual_witch"]
};
// Returns true if profile has ANY of these archetypes

// Match expression modes (ANY of these)
const filter: DiscoveryFilter = {
  expression_modes: ["performative_power_play", "meta_aware_dynamics"]
};

// Match kink alignment (ALL of these required)
const filter: DiscoveryFilter = {
  kink_alignment: ["power_exchange", "transactional_intimacy"]
};

// Combined filtering
const filter: DiscoveryFilter = {
  archetypes: ["pastel_goth"],
  expression_modes: ["ironic_submission_dominance"],
  pace: "slow_burn",
  harm_history_disclosed: true
};
```

**Algorithm:**
- AND logic between filter categories (all must match)
- OR logic within categories (any can match)
- Defaults to `true` (no filter = show all)

---

## Implementation Phases

### Phase 1: Database & Serialization (Week 1)

- [ ] Update `resonance_spec.ex` with new attributes
- [ ] Create Ash migration
- [ ] Update `yaml_serializer.ex` to handle all layers
- [ ] Write YAML round-trip tests
- [ ] Test backward compatibility (old YAML imports)

**Deliverables:**
- Database schema updated
- YAML import/export fully functional
- Test coverage for serialization

### Phase 2: TypeScript Integration (Week 1)

- [x] ✅ `resonance-profile.ts` created
- [ ] Add to `tsconfig.json` if needed
- [ ] Create TypeScript tests for:
  - `computeInteractionTemperature()`
  - `matches()` filtering
  - `getProfileCompletionPercentage()`

**Deliverables:**
- Type system complete
- Utility functions tested
- Type definitions exported for use in LiveView

### Phase 3: ResonanceEditor UI (Week 2)

- [ ] Refactor `resonance_live.ex` into tab-based editor
- [ ] Create sub-components for each layer:
  - `_attention_form.heex`
  - `_archetypes_form.heex` (with custom archetype creator)
  - `_attraction_form.heex`
  - `_engagement_form.heex`
  - `_dynamics_form.heex`
  - `_safety_form.heex`
  - `_trust_form.heex`
  - `_discovery_form.heex`
  - `_foundations_form.heex`
- [ ] Implement Supabase file upload for media
- [ ] Add form validation
- [ ] Add completion percentage tracker

**Deliverables:**
- Full-featured editor
- All layers editable
- Media upload working
- Sparse initialization with defaults

### Phase 4: ResonanceProfileView (Week 2)

- [ ] Create display components for each layer
- [ ] Implement visibility gating (relationship depth)
- [ ] Create archetype preview cards
- [ ] Create engagement timeline visualization
- [ ] Add filter UI for discovery

**Deliverables:**
- Profile display beautiful and clear
- All layers rendered contextually
- Archetype cards look polished

### Phase 5: Matching & Discovery (Week 3)

- [ ] Implement filter UI
- [ ] Connect `matches()` function to discovery search
- [ ] Add faceted filtering (archetypes, expression modes, etc.)
- [ ] Create search results page

**Deliverables:**
- Users can find each other by filters
- Compatibility scoring visible
- Matching algorithm tested

### Phase 6: Testing & Refinement (Week 3)

- [ ] E2E tests for full workflow
- [ ] Load testing with large profiles
- [ ] UX polish and accessibility
- [ ] Documentation for users

---

## Migration Path (Backward Compatibility)

### For Existing Users

**Scenario:** User has an old resonance spec with just `name`, `description`, `activation_vectors`, etc.

**On first load:**
1. Database loads old record
2. Missing new attributes get defaults from schema
3. YAML export includes full new structure with sensible defaults
4. User can edit to add more detail

**Example:**

```elixir
old_spec = %ResonanceSpec{
  name: "My Spec",
  description: "...",
  activation_vectors: ["..."],
  repulsion_vectors: ["..."],
  # All new attributes are nil, schema provides defaults
}

# After schema update:
old_spec.archetypes  # => [] (default)
old_spec.dynamic_preferences  # => %{} (default)
old_spec.trust_profile  # => %{} (default)
```

**No breaking changes:** Old YAML still imports correctly, new fields get defaults.

---

## Testing Strategy

### Unit Tests

```elixir
# test/woem/resonance/yaml_serializer_test.exs
describe "YAML round-trip with new layers" do
  test "sparse profile round-trips correctly" do
    spec = create_sparse_spec()
    yaml = YamlSerializer.to_yaml(spec)
    {:ok, data} = YamlSerializer.from_yaml(yaml)
    
    assert data["name"] == spec.name
    assert data["archetypes"] == []
    assert data["dynamic_preferences"] == %{}
  end
  
  test "full profile preserves all data" do
    spec = create_full_spec()
    yaml = YamlSerializer.to_yaml(spec)
    {:ok, data} = YamlSerializer.from_yaml(yaml)
    
    assert data["trust_profile"]["harm_history"] == spec.trust_profile["harm_history"]
    assert data["dynamic_preferences"]["power"]["expression_modes"] == [...]
    assert data["archetypes"] |> length() == 2
  end
  
  test "custom archetypes marked custom: true" do
    # ...
  end
  
  test "media URLs preserved in discovery_introduction" do
    # ...
  end
end
```

### TypeScript Tests

```typescript
// test/resonance-profile.test.ts
describe("ExperientialProfile", () => {
  test("sparse profile has sensible defaults", () => {
    const profile = createDefaultExperientialProfile();
    expect(profile.attention_model.type).toBe("resonance_not_persuasion");
    expect(profile.archetypes).toEqual([]);
    expect(profile.dynamic_preferences.power.enabled).toBe(false);
  });
  
  test("computeInteractionTemperature works correctly", () => {
    const profile = createDefaultExperientialProfile();
    profile.dynamic_preferences!.play!.intensity_profile = {
      emotional: "high",
      theatrical: "medium",
      intellectual: "high"
    };
    
    const temp = computeInteractionTemperature(profile);
    expect(temp.intensity).toBe("high");
  });
  
  test("matches filters correctly", () => {
    const profile = createDefaultExperientialProfile();
    profile.archetypes = [{ id: "pastel_goth", ... }];
    profile.dynamic_preferences!.power!.enabled = true;
    profile.dynamic_preferences!.power!.expression_modes = ["performative_power_play"];
    
    const filter: DiscoveryFilter = {
      arc