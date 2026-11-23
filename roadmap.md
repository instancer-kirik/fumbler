# Current tasks

## About and FAQ

- [x] Move only the unique FAQ details to About.
- [x] Add a clearly labeled About link to the Profile menu and clarify the existing drawer label.

## Selected security findings

- [ ] Map only the selected scan findings to their current table and storage policies.
- [ ] Replace broad signed-in and permissive rules with owner, membership, or role checks.
- [ ] Test affected access paths, mark fixed findings, and leave every unselected finding unchanged.

## Help team button

- [x] Add Start chat beside Send to help team, with private saved threads and help-team replies.
- [x] Test chat validation, rolled-back permissions, and mocked phone-size interactions.
- [ ] Exercise real signed-in chat submission; blocked by external/unmanaged Supabase auth. The mocked thread/reply walkthrough and database privacy checks passed.
- [x] Add a playful global Help button and private help-request form.
- [x] Store requests privately, allow help-team review, and verify validation, mocked submission, and database permissions.
- [ ] Exercise a real signed-in submission; blocked by external/unmanaged Supabase auth. The mocked UI walkthrough passed.

## Platonic mode and meetups

- [x] Add an All / Platonic discovery mode without changing existing dating preferences; keep platonic seekers visible in All with a Platonic badge.
- [x] Add isolated meetup and RSVP storage with owner-scoped access and capacity validation.
- [x] Build the Meetups page, hosting flow, responses, and navigation.
- [x] Add rule tests and verify the preview at mobile and desktop sizes.
- [ ] Exercise the UI with a real signed-in account; blocked by external/unmanaged Supabase auth. Rolled-back database permission/capacity tests and mocked UI flows passed.

## Calling people

- [x] Store an optional phone number on each private People entry and tap to dial it.
- [x] Show your real help-team number in Help & Support: +1 (443) 280-8685.
