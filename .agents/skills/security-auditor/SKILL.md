# Skill: Security Auditor

## Purpose
Enforces rigorous security standards globally.

## Guidelines
- Audit all Server Actions to ensure they authenticate the `supabase.auth.getUser()` before proceeding with mutations.
- Filter and sanitize any user inputs outputted into the DOM, particularly outputs rendered from the CMS or generic HTML inputs to prevent XSS.
- Provide proper rate-limiting wrappers around authentication and public API mutations.
- Check that all environments have properly configured `.env` with strict separation between public and private keys.
