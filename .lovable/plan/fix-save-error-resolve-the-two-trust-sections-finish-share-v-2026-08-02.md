# Fix save error, resolve the two "Trust" sections, finish share-view ordering

## 1. "age_min must be between 18 and 120"

Your profile row currently holds `age_min = 1` (saved before the validation trigger existed). Every profile save now re-sends that value and the trigger rejects it — the error is not about what you typed.

Fix, three parts:

- One-off data correction: set `age_min = 18` for any profile row where `age_min < 18` (same for `age_max` outside 18–120).
- Client-side guard in the profile editor and discovery filters: clamp entered values to 18–120, treat blank as "no preference" (null), and block save with an inline message if min > max — so the DB error never surfaces again.
- Friendlier error text if the trigger still fires.

## 2. The two "Trust" sections

They cover different things, so the fix is naming, not merging:

- `Trust+Consumer` (🔎) = signals you read in *other people / things* — "What earns or loses your trust".
- `Safety & Trust` (🛡️) = consent frameworks, hard boundaries, accountability → rename to **Safety & Consent**.

Renames applied in both the share view and the resonance editor so they stay in sync.

## 3. Full share-view ordering

Your list plus the sections you didn't mention, slotted where they fit:

```text
GTKM
Aura
Aesthetics            (folded into Aura block)
Resonances
Qualities
Languages
Archetypes
Identity Frames
Seeking
Offering / Roles
Collaborations
Desires
| Power Exchange
| Play Preferences
Attraction Gradient
Engagement Curve
Dynamics
Trust+Consumer
Aliases
Safety & Consent      (was Safety & Trust)
Repulsion Vectors
Loops
Lessons
Aspirations
Dream Log
Availability & Rhythm
Connection
Sizing
Economic
Content
Glossary
Discovery
```

## Technical notes

- Data fix via an update statement on `profiles`; the existing `validate_profile_age` trigger stays as-is.
- Validation added in `EditProfileSheet.tsx` and `DiscoverFiltersSheet.tsx` before the update call.
- Section reorder and label changes in `src/pages/PublicProfile.tsx`; matching labels in `src/components/profile/ResonanceEditor.tsx`. Visibility keys (`signals`, `safety`, …) are unchanged, so no stored profile data moves.