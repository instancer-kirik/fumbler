

# Resonance Profile: Full Restructure and Gap Sync

## Overview

Restructure the Resonance Editor from a single scrollable accordion into a **5-tab layout**, and add the 6 missing layers from the unified spec. The viewer gets matching new sections. No database migration needed -- everything stores in the existing `resonance_data` JSONB column.

## Tab Structure

```text
Tab 1: Foundations
  Loops, Lessons, Languages, Desires/Kinks, Relational Type

Tab 2: Attraction  [NEW]
  Archetypes (presets + custom), Attraction Gradient, Engagement Curve

Tab 3: Dynamics  [NEW]
  Power Exchange, Play Preferences, Kink Alignment, Repulsion Vectors

Tab 4: Seeking & Safety
  Core Resonance, Consumer Interface, Seeking, Safety + Trust Profile

Tab 5: Meta
  Viability, Economic, Connection, Discovery (+ media URLs), Glossary
```

## Technical Steps

### 1. Expand TypeScript types (`src/data/resonance-profile.ts`)
Add interfaces for the missing layers:
- `ArchetypePacket` (id, label, class, aesthetic, energy, dynamic, tone, performance, custom flag)
- `AttractionGradient` (slow_burn, fast_hook, what_draws_in, timeline)
- `EngagementCurve` (phase_1, phase_2, phase_3) + `CooperationStyle`
- `PowerDynamics` (enabled, expression_modes, exploration text)
- `PlayPreferences` (mode, intensity profile: emotional/theatrical/intellectual)
- `RepulsionVectors` (hard_stops, yellow_flags, pattern_concerns)
- `TrustProfile` (harm_history, references_available)
- `DiscoveryIntroduction` (audio_intro, video_intro URLs)

Update the main `ExperientialProfile` to include all new layers. Add `willing_to_have_compatibility_shared` to `DiscoveryMetadata`. Add `harm_history` and `references_available` to `SafetyProfile`.

### 2. Expand Editor data model (`src/components/profile/ResonanceEditor.tsx`)
- Add all new fields to `ResonanceData` with sparse defaults (empty arrays, false booleans, empty strings)
- No existing data breaks -- missing keys get defaults on load

### 3. Restructure Editor into 5 tabs
- Wrap existing accordion sections in the Tabs component
- Move sections into their respective tab groups
- Build new form sections:
  - **Archetypes**: Preset checkboxes (Pastel Goth, Maid Ritual, etc.) + custom archetype form with label, aesthetic tags, energy select
  - **Attraction Gradient**: Slow burn / fast hook toggle, tag inputs for signals, timeline select
  - **Engagement Curve**: 3 phase textareas + cooperation style select
  - **Power Exchange**: Enabled switch, expression mode checkboxes (performative power play, ironic submission, theatrical absurdity, symbolic transaction, meta-aware dynamics), exploration textarea
  - **Play Preferences**: Mode select, 3 intensity sliders (emotional, theatrical, intellectual)
  - **Repulsion Vectors**: 3 separate tag-input lists (hard stops, yellow flags, pattern concerns)
  - **Trust Profile**: Harm history textarea, references available checkbox
  - **Discovery media**: Audio/video URL text inputs

### 4. Update Profile Viewer (`src/components/ResonanceProfileView.tsx`)
Add rendering sections for each new layer:
- Archetype cards with aesthetic tags and energy badges
- Attraction gradient display (slow burn vs fast hook)
- Engagement curve as phased timeline
- Dynamic preferences with expression mode tags and intensity bars
- Repulsion vectors categorized by severity
- Trust profile (harm history text, references badge)
- Media players for audio/video intro URLs
- Apply existing visibility gating to new sections

### 5. Update mock data (`src/data/resonance-profile.ts`)
Add example data for all new layers across the 4 existing mock profiles so the UI has something to render during development.

## Not Included (Future Work)
- File upload for audio/video (URLs only for now)
- Matching algorithm using new layers
- Archetype preset library with visual previews
- Relationship-depth visibility gating

