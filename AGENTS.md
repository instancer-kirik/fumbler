# Architecture

- Keep the aesthetic atlas text-first: curated definitions live in typed client data, while community entries and Goal Style lists use Supabase; this avoids duplicating Pinterest while keeping shared-profile visibility enforceable with RLS.
- Build artist discovery on the existing artists directory plus owner-scoped intro media and private storage signed URLs; requiring preview material keeps Follow suggestions evidence-based without exposing permanent upload URLs.
