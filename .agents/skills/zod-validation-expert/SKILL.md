# Skill: Zod Validation Expert

## Purpose
Defines the standards for schema validation for both the frontend forms and backend payloads.

## Guidelines
- Wrap all form inputs in `react-hook-form` and integrate tightly with `@hookform/resolvers/zod`.
- Declare Zod schemas in a shared `/schemas` directory so both client and server actions can import the exact identical schema.
- Always validate incoming payloads on Server Actions or API routes via `schema.safeParse`.
- Return highly descriptive error objects back to the component when validation fails to show precise inline warnings.
