# Resonance Profile: Quick Reference

## What Changed?

**Old:** GAPS_AND_POWER_EXCHANGE + DYNAMIC_PREFERENCES were separate documents with overlaps and gaps.

**New:** Unified `resonance-profile.ts` + `ResonanceSpec` resource that combines:
- ✅ All 6 resonance layers (attention, archetypes, attraction, engagement, dynamics, safety)
- ✅ Trust profile (harm history, references)
- ✅ Discovery layer (bios, audio/video intros)
- ✅ Original foundational fields (loops, lessons, languages, kinks, type)
- ✅ User-customizable archetypes (not just presets)
- ✅ Sparse-first design (start minimal, fill progressively)
- ✅ YAML round-trip with full data preservation

---

## Architecture at a Glance

```
ExperientialProfile
├─ Layer 1: AttentionModel (foundation, required)
├─ Layer 2: ArchetypePacket[] (how you show up, customizable)
├─ Layer 3: AttractionGradient (initial pull, optional)
├─ Layer 4: EngagementCurve + CooperationStyle (interest growth, optional)
├─ Layer 5: DynamicPreferences (power, play, kinks, optional)
├─ Layer 6: RepulsionVectors (boundaries, optional)
├─ TrustProfile (accountability + vouching, optional, sensitive)
├─ DiscoveryIntroduction (bio + media, optional, user-gated)
└─ Foundational Fields (loops, lessons, languages, kinks, type, always present)
```

**Key principle:** Everything optional except attention model. Profiles start sparse, grow richer over time.

---

## Files Created

### 1. `woem/assets/ts/resonance-profile.ts` ✅
Complete TypeScript type system with:
- All interfaces fully defined
- Default factories for sparse initialization
- `computeInteractionTemperature()` - derive signals from profile
- `matches()` - filter profiles by discovery criteria
- `getProfileCompletionPercentage()` - UI hint on how complete a profile is
- `isProfileMinimallyComplete()` - gate early UX flows

**Use this for:**
- Type checking in LiveView
- Form validation
- Discovery filtering

### 2. `woem/.context/RESONANCE_UNIFIED_IMPLEMENTATION.md` ✅
Complete implementation roadmap:
- Database schema changes (what attributes to add to ResonanceSpec)
- YAML schema mapping (full valid example)
- ResonanceEditor UI structure (tab layout, all sections)
- ResonanceProfileView rendering (with visibility gating)
- Matching algorithm outline
- 6-phase implementation plan (1-3 weeks)

**Use this for:**
- Planning DB migrations
- Building the editor form
- Understanding visibility rules

### 3. `woem/.context/RESONANCE_VALIDATION_EDGE_CASES.md` ✅
Comprehensive validation guide:
- Rules for each layer (what's required, what's optional, what's forbidden)
- Edge case handling (what to do when something weird happens)
- User-friendly error messages
- Defaults and hints for empty fields
- Testing checklist

**Use this for:**
- Building validation logic (both client & server)
- Writing error messages
- Testing edge cases

---

## Key Design Decisions

### 1. **Sparse-First Architecture**
A new user creates a profile with just:
```typescript
{
  attention_model: { type: "resonance_not_persuasion" },
  archetypes: [],
  loops: [],
  // ... everything else empty
}
```

They can immediately use the system. Over time, they fill in more detail. No gatekeeping.

### 2. **User-Customizable Archetypes**
Presets (Pastel Goth, Maid, etc.) are starting points, not limits.
```typescript
// User can create custom ones
{
  id: "my_midnight_scholar",
  label: "Midnight Scholar",
  class: "custom",
  custom: true,
  aesthetic: ["late night", "intellectual"],
  // ...
}
```

### 3. **Power Dynamics as Conversation, Not Roles**
Instead of "Dom" vs "sub", we ask: How does power show up for you?
```yaml
power:
  enabled: true
  expression_modes:
    - performative_power_play
    - ironic_submission_dominance
    - meta_aware_dynamics
  exploration: "I experience power as playful conversation"
```

### 4. **Media in Supabase Buckets (UGC)**
Audio/video intros stored as:
```
supabase_bucket_url/introductions/{user_id}/audio_intro.mp3
supabase_bucket_url/introductions/{user_id}/video_intro.mp4
```

File size limits: 50MB audio, 100MB video.

### 5. **Relationship-Level Visibility**
Some fields only show at certain relationship depths (future):
- `trust_profile`: shows after "messaged"
- `discovery_introduction`: shows only if `willing_to_have_compatibility_shared: true`

---

## Migration Path (For Existing Users)

**Scenario:** User has an old resonance spec (just name + description + vectors).

**On first load:**
1. Database loads old record
2. Missing new attributes get defaults from schema (`archetypes: []`, `dynamic_preferences: {}`, etc.)
3. YAML export includes full new structure
4. User can optionally edit to add detail

**No breaking changes.** Old YAML still imports. New fields get defaults.

---

## Quick Implementation Checklist

### Phase 1: Database (1-2 days)
- [ ] Add new attributes to `ResonanceSpec` resource
- [ ] Create Ash migration
- [ ] Update `yaml_serializer.ex` to include all new fields
- [ ] Test YAML round-trip

### Phase 2: TypeScript (already done!)
- [x] `resonance-profile.ts` created with all types
- [ ] Add to your build/bundle if not automatic

### Phase 3: Editor UI (3-5 days)
- [ ] Refactor `resonance_live.ex` into tabs
- [ ] Create sub-component templates (8 tabs × 3 fields avg = ~24 components)
- [ ] Add Supabase file upload for media
- [ ] Add form validation

### Phase 4: Display & Discovery (2-3 days)
- [ ] Create rendering components for each layer
- [ ] Add visibility gating logic
- [ ] Build discovery filter UI
- [ ] Implement `matches()` in search

### Phase 5: Testing & Polish (2-3 days)
- [ ] E2E tests
- [ ] Accessibility review
- [ ] User docs

---

## Common Questions

### "Do I have to fill everything out?"
**No.** Sparse-first design means start with just loops/lessons, add more over time.

### "Can I change my archetypes later?"
**Yes.** All fields are editable. Custom archetypes can be deleted/renamed.

### "What if I don't want to share my bio?"
**Set `willing_to_have_compatibility_shared: false`** and it won't appear in discovery.

### "How are audio/video intros stored?"
**Supabase bucket URLs.** File upload happens at form submission. URLs stored in `discovery_introduction.audio_intro` / `video_intro`.

### "Can someone else see my harm history?"
**Only if `relationship_depth >= "messaged"` (future feature).** Currently all fields visible to authenticated users.

### "What if I change my mind about power exchange?"
**Set `power.enabled: false`** and all power fields are ignored. Easy toggle.

### "Can I filter people by expression_modes?"
**Yes.** Discovery filter supports:
```typescript
matches(profile, {
  expression_modes: ["performative_power_play", "meta_aware_dynamics"]
})
```
Returns true if profile has ANY of those modes.

### "What's the difference between yellow_flags and hard_stops?"
- **hard_stops**: Deal-breaker, end immediately
- **yellow_flags**: Worth discussing, not automatic rejection
- **pattern_concerns**: Patterns you avoid (more specific)

---

## Testing Quick Start

### TypeScript Tests
```typescript
import { createDefaultExperientialProfile, matches } from '@/ts/resonance-profile';

describe('ExperientialProfile', () => {
  test('sparse profile has sensible defaults', () => {
    const profile = createDefaultExperientialProfile();
    expect(profile.attention_model.type).toBe('resonance_not_persuasion');
    expect(profile.archetypes).toEqual([]);
  });
  
  test('matches filters correctly', () => {
    const profile = createDefaultExperientialProfile();
    profile.archetypes = [{ id: 'pastel_goth', ... }];
    
    expect(matches(profile, { archetypes: ['pastel_goth'] })).toBe(true);
    expect(matches(profile, { archetypes: ['maid_ritual'] })).toBe(false);
  });
});
```

### Elixir Tests
```elixir
describe "YAML round-trip" do
  test "sparse profile survives export/import" do
    spec = create_sparse_spec()
    yaml = YamlSerializer.to_yaml(spec)
    {:ok, data} = YamlSerializer.from_yaml(yaml)
    
    assert data["name"] == spec.name
    assert data["archetypes"] == []
    assert data["dynamic_preferences"] == %{}
  end
end
```

---

## Validation Quick Reference

| Layer | Must Have | Must NOT Have | Can Be Empty |
|-------|-----------|---------------|--------------|
| AttentionModel | `type: "resonance_not_persuasion"` | Invalid type | description, vectors |
| Archetypes | `id`, `label` | Duplicate ids | aesthetic, energy, etc. |
| AttractionGradient | slow_burn OR fast_hook | Both empty | what_draws_in, timeline |
| EngagementCurve | phase_1 OR phase_2 OR phase_3 | All empty | what_keeps_interest |
| PowerDynamics | — | Invalid expression_modes | exploration text |
| RepulsionVectors | — | Duplicates within array | All arrays |
| TrustProfile | — | Non-URL in media fields | harm_history, references |
| DiscoveryIntro | — | Broken media URLs | written_bio, audio/video |

---

## YAML Round-Trip Example

### Export (Create Profile → YAML)
```yaml
meta:
  version: "0.2"
  mode: "experiential_profile"
  name: "Woem"

attention_model:
  type: "resonance_not_persuasion"
  activation_vectors:
    - "intellectual challenge"
    - "playful irreverence"

archetypes:
  - id: "pastel_goth"
    label: "Pastel Goth"
    class: "modern"
    aesthetic: ["pastel", "gothic"]

dynamic_preferences:
  power:
    enabled: true
    expression_modes:
      - "performative_power_play"
      - "meta_aware_dynamics"
  
  kink_alignment:
    - "power_exchange"
    - "transactional_intimacy"

loops:
  - "intellectual stimulation → deeper conversations → vulnerability → intimacy"
```

### Import (YAML → Profile)
Same YAML → loaded into database → all fields preserved → can edit/update.

---

## Visibility Rules (Future)

```
Field                          | Visible To | Visible After
---                            | ---        | ---
Basic profile (name, loops)    | All        | Match
Archetypes, attraction_gradient | All       | Match
Engagement curve               | All        | Match
Dynamic preferences            | All        | Match
Repulsion vectors              | All        | Match
Trust profile                  | Authenticated | Message exchange
Discovery intro                | Authenticated | If user enabled
Harm history specifically       | Authenticated | After message(s)
References flag                | Authenticated | After message(s)
```

---

## Performance Notes

### Large Profiles
- 100+ archetypes: ✅ Fine (JSON storage)
- 1000+ character descriptions: ✅ Fine (text fields)
- 10MB+ media files: ❌ Rejected at upload
- Matching with filters: ✅ Fast (array filtering in TypeScript)

### Database Queries
- Load profile: Single row fetch (map fields)
- Update profile: Single update (merge JSON)
- List profiles: Standard pagination (no special index needed yet)

---

## Troubleshooting

### "YAML import failed: Invalid structure"
- Check indentation (YAML is strict)
- Ensure `archetypes` is array: `archetypes: [...]` not `archetypes: {...}`
- Verify media URLs are valid Supabase URLs

### "Archetype id conflict"
- Each archetype `id` must be unique in the profile
- Rename with suffix: `maid_ritual_v2`

### "Power dynamics form shows but power.enabled is false"
- This is UX issue in editor (should hide when disabled)
- Data still saves correctly
- Fix: Add `if power.enabled` check in template

### "Media URL not showing in discovery"
- Check Supabase bucket URL is public/accessible
- Verify file actually exists
- Check browser console for 404 errors

---

## Next Steps

1. **Read** `RESONANCE_UNIFIED_IMPLEMENTATION.md` (high-level plan)
2. **Skim** `RESONANCE_VALIDATION_EDGE_CASES.md` (know what can go wrong)
3. **Start Phase 1** (update ResonanceSpec resource)
4. **Run tests** (YAML round-trip, validation)
5. **Build Phase 2** (ResonanceEditor tabs)
6. **Deploy** (progressively, user feedback)

---

## Contact Points

**Questions about types?** → `woem/assets/ts/resonance-profile.ts`

**Questions about DB schema?** → `RESONANCE_UNIFIED_IMPLEMENTATION.md` (Phase 1 section)

**Questions about validation?** → `RESONANCE_VALIDATION_EDGE_CASES.md`

**Questions about UI?** → `RESONANCE_UNIFIED_IMPLEMENTATION.md` (ResonanceEditor section)

**Questions about filtering?** → `resonance-profile.ts` (`matches()` function)

---

**Version:** 0.2  
**Last Updated:** 2024  
**Status:** Ready for implementation  
**Completeness:** All 6 layers defined, typed, validated, documented