
# Shareable Profile Link — "Share your context"

## What you're asking for

You want a simple way to copy/share your `fumbler.lovable.app/u/baon` link so you can hand it to someone on another dating site as a "here's my context before we go further" gesture. The public profile page already exists and renders your resonance data — we just need to make that link easy to grab and frame it well.

## What we'll build

### 1. Share card on your Profile page
A new card just below the avatar section in `/profile` showing:
- Your public URL (`fumbler.lovable.app/u/baon`)
- A **Copy link** button (uses `navigator.clipboard`)
- A **Share** button (uses the native Web Share API on mobile — falls back to copy on desktop)
- Small note: "Send this to someone before you meet"

### 2. Share button on the Public Profile page (`/u/baon`)
A sticky share button at the top of the public profile — so if someone opens your link, they can also easily share it further. Also useful when you're previewing your own profile: you can share directly from there.

### 3. Minor: "View my public profile" link in ProfilePage
A small text link under the share card that opens `/u/baon` in a new tab so you can preview exactly what the other person will see before you send it.

## Technical details

**Files to edit:**

- `src/components/ProfilePage.tsx` — Add share card below avatar block; add "view public profile" link. Reads `profile.username` which is already fetched.
- `src/pages/PublicProfile.tsx` — Add a share/copy button row near the top (below the back arrow), using the same clipboard + Web Share API pattern.

**Share logic (no new dependencies):**
```typescript
const url = `https://fumbler.lovable.app/u/${username}`;

const handleShare = async () => {
  if (navigator.share) {
    await navigator.share({ title: "My Fumbler profile", url });
  } else {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  }
};
```

**No database changes needed** — username is already in the `profiles` table and fetched by both pages.

## What it will look like

In `/profile`, below the avatar:

```text
┌─────────────────────────────────────┐
│  🔗 fumbler.lovable.app/u/baon      │
│  Send this to someone before you    │
│  meet — they'll see your public     │
│  resonance sections.                │
│                                     │
│  [ 📋 Copy link ]  [ ↗ Share ]      │
│  [ 👁 Preview my public profile ]   │
└─────────────────────────────────────┘
```

In `/u/baon`, near the top:
```text
[ ↗ Share this profile ]
```
