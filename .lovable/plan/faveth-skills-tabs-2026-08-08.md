# Faveth + Skills tabs

Two new sections in the resonance profile: **Faveth** (the things you're drawn to) and **Skills** (what you can do, teach, or want to learn). Both get their own editor tab, their own visibility toggle, and their own block in the share view.

## Faveth

A home for preferred, significant, or otherwise important things. Tag lists:

- Flowers
- Plants
- Animals
- Dream cars / vehicles
- Media (books, film, music, games)
- Favorite instruments / sounds
- Foods & drinks
- Places
- Colors
- Scents
- Date ideas
- Freeform "other faves"

`favoriteFlowers` and `dateIdeas` move out of Get to Know Me into Faveth (existing values are carried over automatically, nothing is lost). Get to Know Me keeps height, build, current obsession, ideal weekend, favorite media stays mirrored there only if already set.

## Skills

Each entry is a small card, not just a chip:

- Name (e.g. "welding", "bass guitar", "Blender")
- Level: dabbling / working / solid / deep
- Intent: can teach / want to learn / just do it
- Optional one-line note

Instruments played live here as skills; favorite instruments/sounds stay in Faveth.

## Share view

Two new collapsible sections, gated server-side by their own visibility keys so hidden data is never sent to the browser.

- **Faveth** renders as grouped tag rows, only non-empty groups shown.
- **Skills** renders grouped by intent (Can teach / Learning / Practicing), each skill showing its level as a small badge.

Placement in the section order: Faveth right after Get to Know Me; Skills right after Faveth.

## Technical notes

- `src/utils/resonance-normalizer.ts`: add `faveth` (object of string arrays) and `skills` (array of `{name, level, intent, note}`) to the normalized shape; migrate legacy `getToKnowMe.favoriteFlowers` / `dateIdeas` into `faveth` when present.
- `src/components/profile/ResonanceEditor.tsx`: grid goes from 5 to 7 tabs (wraps to two rows on mobile); Faveth uses existing `TagField`, Skills uses a new repeatable row editor with two selects.
- `get_resonance` RPC: add `faveth` and `skills` to the emitted object, filtered by the new `sectionVisibility` keys.
- `src/pages/PublicProfile.tsx` and `src/components/ResonanceProfileView.tsx`: add both sections to `SECTION_KEYS` and the render order.
- Visibility defaults: Faveth public, Skills public; both switchable to matches/express like other sections.
