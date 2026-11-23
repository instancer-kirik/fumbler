# Add platonic discovery and meetups

## What changes

- Add an **All / Platonic** switch to Discover. Platonic mode shows only people who explicitly opted into Platonic or Friends, ignores gender/orientation and romantic-intent filters, and links directly to meetups.
- Add a protected **Meetups** page with search, activity categories, upcoming plans, and a simple host form: activity, description, general location, start/end time, and optional guest limit.
- Let signed-in people mark themselves **Going** or **Interested**, join a waitlist when full, change or withdraw their response, and let hosts edit or cancel their own plans and see responses.
- Keep existing dating, profiles, matches, and other apps’ event data intact.

## Data and access

- Create Fumbler-specific `fumble_meetups` and `fumble_meetup_rsvps` tables rather than reusing the shared `events` table.
- Signed-in users can browse published, non-cancelled meetups from people they are allowed to see. Only hosts can create, edit, or cancel their meetups. People can manage only their own responses; hosts can view responses to their plans.
- Validate dates and guest limits in Postgres. RSVP capacity handling uses a trigger so a full plan produces a waitlist response rather than overfilling.

## Verification

- Add focused tests for platonic-only discovery rules and filter isolation.
- Run the related test suites, inspect the preview build, and exercise the new screens at mobile and desktop sizes.
- Test real signed-in database writes if this environment can provide a session; otherwise report that limitation explicitly.
