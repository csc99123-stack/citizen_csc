# Skill: Web Performance Optimization

## Purpose
Sets strict boundaries and techniques for maintaining near-perfect Lighthouse scores.

## Guidelines
- Always use Next.js `next/image` tag properly configuring `priority` for above-the-fold content.
- Implement lazy loading or `dynamic` imports for heavy third-party components (e.g. PDF generators or Heavy Editors like TipTap).
- Aggressively cache static routes and fetch requests.
- Optimize layouts dynamically to reduce Cumulative Layout Shift (CLS).
