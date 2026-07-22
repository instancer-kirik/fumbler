
# What's left for production

Grounded in a live security scan, DB linter, and current publish state (already published public at fumbler.lovable.app).

## 1. Security & privacy (must-fix before real users)

**Confirmed findings from the scanner + linter:**

- **`resonance_field_visibility` leaks everyone's privacy prefs.** Policy is `USING (true)` for all authenticated users. Restrict SELECT to `auth.uid() = user_id` (the RPC already gates real reads server-side).
- **Age validation is client-only.** Add a validation trigger on `profiles` enforcing `age IS NULL OR age BETWEEN 18 AND 120` (use trigger, not CHECK, per project convention).
- **`missed_connections.is_anonymous` leak check.** Verify RLS/SELECT never returns `author_id` when `is_anonymous = true` for non-authors — currently we filter client-side, which is not enough. Move to a SECURITY DEFINER view or a policy that returns author only to the author.
- **Drop ~160 unused legacy tables** (loreum_*, pockets_*, radio_*, products, projects, artists, brands, etc.) left over from other projects. Several have `ERROR`-level findings: any authenticated user can edit/delete other users' rows. Even though Fumbler doesn't use them, they're reachable via the anon key. One migration to `DROP TABLE ... CASCADE` everything not in the Fumbler set.
- **Turn on Supabase "Leaked Password Protection"** (Auth settings toggle — I'll flag it, user clicks).
- **Upgrade Postgres** to current patch version (dashboard action — I'll flag it).
- **Review `SECURITY DEFINER` functions** (`get_public_identity`, `get_resonance`) — confirm `EXECUTE` grants are intentional for anon/authenticated. They are (public profiles need it), so I'll mark those findings as reviewed rather than change them.

## 2. Auth completeness

- **Password reset flow.** No `/reset-password` route exists. Add a Forgot Password link on the auth screen, wire `resetPasswordForEmail`, and build `/reset-password` that reads the recovery hash and calls `updateUser({ password })`.
- **Email confirmation UX.** Confirm the signup flow tells the user to check email and handles the confirmation redirect without dumping them on a blank page.
- **Sign out / delete account.** Sign-out exists; add a "Delete my account" button in Profile → Settings that calls a `delete_my_account` edge function (auth.admin.deleteUser).

## 3. Empty / error / offline states

- **Discover empty state.** When filters return 0 candidates, show "No matches — try loosening your filters" with a button that opens the filters sheet.
- **Photo upload failures.** Surface a toast on storage errors instead of silent failure.
- **Missed connections empty state per category/city.**
- **404 page** — currently generic; make it match the theme with a link home.

## 4. Landing, SEO, meta

- Confirm `<title>` and `<meta name="description">` are Fumbler-specific (not "Lovable App").
- Add `og:title` / `og:description` / `twitter:card` matching the anti-sell brand voice.
- Favicon check — using default Vite favicon still.
- Landing copy sweep: ensure "Fumbler" everywhere, working call-to-action, no `/u/baon` references left.

## 5. Nice-to-have before launch (defer if you want)

- Rate limiting on missed-connection posts (one edge function that checks recent post count).
- Report/block flow (block exists in DB — verify it's wired into Discover to actually hide blockers).
- Basic analytics event on signup / first match.

---

## Technical details

**Migration 1 — RLS tightening:**
```sql
DROP POLICY "Authenticated users can read field visibility" ON public.resonance_field_visibility;
CREATE POLICY "Users read own visibility" ON public.resonance_field_visibility
  FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.validate_profile_age() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.age IS NOT NULL AND (NEW.age < 18 OR NEW.age > 120) THEN
    RAISE EXCEPTION 'Age must be between 18 and 120';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER profiles_age_check BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_age();
```

**Migration 2 — missed_connections author privacy:** replace direct table SELECT policy with a view/function that nulls `author_id` when `is_anonymous` and the caller isn't the author.

**Migration 3 — drop legacy tables:** enumerate the ~160 non-Fumbler tables and `DROP TABLE ... CASCADE` in one batch. Keeps: `profiles`, `fumble_photos`, `swipes`, `matches`, `missed_connections`, `missed_connection_reactions`, `user_blocks`, `user_roles`, `resonance_field_visibility`, `resonance_field_grants`, `resonance_access_requests`, `profile_share_keys`.

**New files:** `src/pages/ResetPassword.tsx`, `src/pages/ForgotPassword.tsx`, `supabase/functions/delete-account/index.ts`.

**Edits:** `App.tsx` (routes), `AuthPage.tsx` (forgot link), `ProfilePage.tsx` (delete account), `DiscoverPage.tsx` (empty state), `NotFound.tsx`, `index.html` (meta).

---

## Suggested order

1. Security migrations + drop unused tables (biggest risk reduction, no UI work).
2. Password reset pages (blocks anyone who forgets their password).
3. Empty states + 404 + landing meta (polish).
4. Delete-account + report/block wiring (before wider launch).

Say the word and I'll start with step 1, or reorder if something else is more urgent.
