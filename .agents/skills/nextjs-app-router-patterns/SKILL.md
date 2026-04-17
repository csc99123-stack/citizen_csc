# Skill: Next.js App Router Patterns

## Purpose
Guides the AI on the best practices for structuring and implementing features using the Next.js App Router.

## Guidelines
- Prefer Server Components (RSC) by default. Only use `use client` when interactivity, hooks natively requiring the DOM, or state is explicitly required.
- Use Next.js Server Actions for data mutations and form submissions rather than classic API endpoints.
- Abstract generic data fetching to inside the route handlers or server functions.
- Optimize layouts by pushing `use client` down the component tree.
- Use Suspense boundaries heavily for partial pre-rendering and loading states.
