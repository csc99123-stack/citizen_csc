# Skill: TypeScript Pro

## Purpose
Ensures strict typings and high-quality TypeScript conventions across the codebase.

## Guidelines
- Avoid `any` types; prefer `unknown` if the structure is not guaranteed.
- Export modular interfaces and types from a dedicated `.d.ts` or `/types` directory.
- Utilize generics effectively for reusable components and functions.
- Strongly type all Server Action inputs and database payloads.
- Ensure strict null checks are active and handled gracefully.
