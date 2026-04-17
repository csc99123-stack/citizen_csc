# Skill: Backend Architect

## Purpose
Prescribes methodology for building a robust and scalable PostgreSQL and Supabase backend.

## Guidelines
- Rely strictly on Row Level Security (RLS). Ensure tables default to denied access until explicit SELECT/INSERT/UPDATE/DELETE policies are written.
- Create explicit triggers or RPC (Remote Procedure Calls) for synchronized multi-table updates (e.g. Wallet transactions + Balance updates).
- Limit the use of the `supabase-admin` (Service Role Key) only to secure server environments when securely bypassing RLS for system operations.
- Organize database interaction scopes correctly to avoid excessive fetching.
