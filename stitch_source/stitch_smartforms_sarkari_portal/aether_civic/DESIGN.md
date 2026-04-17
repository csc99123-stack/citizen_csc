# Design System Specification: Premium Digital Services & Sarkari Ecosystem

## 1. Overview & Creative North Star

### The Creative North Star: "The Modern Magistrate"
This design system moves beyond the cluttered, utility-first aesthetics of traditional government portals to establish a "Modern Magistrate" identity. It combines the unwavering authority of a prestigious institution with the fluid, high-tech agility of a premium SaaS product. 

We break the "template" look by rejecting rigid, boxy structures. Instead, we use **intentional asymmetry** (e.g., hero text aligned left with overlapping glass elements to the right), **generous whitespace**, and **tonal depth**. The goal is to make the complex process of forms and exams feel effortless, transparent, and high-end. We don't just organize data; we curate an experience of trust.

---

## 2. Colors

Our palette transitions from a foundation of deep institutional stability to a vibrant, tech-forward energy.

### Palette Strategy
*   **Primary (`#4f5c76` to `#0A192F`):** Used for structural authority and deep grounding.
*   **Secondary (`#0059bb` to `#007BFF`):** Our "Action Cerulean." This is reserved for primary momentum—CTAs, active states, and critical progress indicators.
*   **Tertiary (`#9e3d00`):** Used sparingly as an "Editorial Accent" for status alerts or high-priority updates that require immediate but sophisticated attention.

### The "No-Line" Rule
**Borders are a relic of the past.** In this system, 1px solid lines for sectioning are strictly prohibited. Boundaries must be defined by:
1.  **Background Shifts:** Transitioning from `surface` to `surface-container-low`.
2.  **Tonal Transitions:** Using subtle shifts in the Material surface tiers to indicate where one functional area ends and another begins.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of frosted glass.
*   **Level 0 (Foundation):** `surface` (`#f7f9fb`)
*   **Level 1 (Sections):** `surface-container-low`
*   **Level 2 (Interactive Elements/Cards):** `surface-container-lowest` (`#ffffff`) placed on Level 1 to create natural lift.

### The "Glass & Gradient" Rule
To ensure a bespoke feel, floating elements (like Modals or Navigation bars) must use **Glassmorphism**. 
*   **Recipe:** Background set to `surface-variant` at 60% opacity with a `backdrop-blur` of 20px. 
*   **Signature Texture:** Main CTAs should not be flat. Use a linear gradient from `secondary` to `secondary_container` at a 135-degree angle to provide "visual soul."

---

## 3. Typography

We utilize **Inter** as our typographic backbone. It is a typeface that balances technical precision with high readability, essential for complex form-filling and exam data.

*   **Display (lg/md/sm):** Reserved for hero statements. Use `display-md` (2.75rem) for main landing headers with `-2%` letter spacing to create a high-end, editorial feel.
*   **Headlines:** Used to introduce major service categories. High contrast in weight (Bold) is required to separate from body copy.
*   **Title (lg/md/sm):** Used for card titles and section headers. 
*   **Body (lg/md/sm):** Use `body-md` (0.875rem) as the workhorse for all instructional text. Maintain a line height of 1.6 for maximum legibility.
*   **Labels:** For navigation and small data points, `label-md` (0.75rem) in All Caps with +5% letter spacing adds a "premium SaaS" touch.

---

## 4. Elevation & Depth

### The Layering Principle
Hierarchy is achieved through **Tonal Layering**. Instead of using a border to define a card, place a `surface-container-lowest` card on top of a `surface-container-low` background. The subtle contrast creates a "soft lift."

### Ambient Shadows
Shadows must be "breathable." 
*   **Values:** Use a 24px blur with 4% opacity. 
*   **Coloring:** Shadows must never be pure grey. Use a tinted version of `on-surface` (a deep navy tint) to mimic natural ambient light.

### The "Ghost Border" Fallback
If a layout absolutely requires a divider for accessibility (e.g., high-density data tables), use a **Ghost Border**. 
*   **Token:** `outline-variant` at 15% opacity. Never use 100% opaque lines.

---

## 5. Components

### Buttons
*   **Primary:** Gradient of `secondary` to `secondary_container`. Roundedness: `md` (0.75rem).
*   **Secondary:** Solid `primary` with `on_primary` text. No border.
*   **Tertiary:** Ghost style. Transparent background, `secondary` text, with a subtle `surface-variant` hover state.

### Glassmorphic Cards
*   **Background:** `surface-container-lowest` at 80% opacity.
*   **Effect:** `backdrop-blur: 12px`.
*   **Border:** A "Ghost Border" of 1px `outline-variant` at 10% opacity to catch the light.

### Input Fields
*   **Structure:** No heavy borders. Use `surface-container-high` as a solid background fill. 
*   **Active State:** Transition background to `surface-container-lowest` and add a 2px `secondary` bottom-accent line (not a full border).

### Chips
*   **Style:** Pill-shaped (`rounded-full`). 
*   **Filter Chips:** Use `primary-fixed-dim` background with `on_primary_fixed` text for a sophisticated, low-contrast look.

---

## 6. Do's and Don'ts

### Do
*   **Do** use overlapping elements. A card should slightly overlap a hero section to create a sense of depth and continuity.
*   **Do** use icons from a refined, thin-weight set (2pt stroke) to match the "Inter" typography.
*   **Do** prioritize vertical whitespace. If you think there is enough space, add 16px more.

### Don't
*   **Don't** use 1px solid borders to separate news items or list entries. Use vertical spacing or subtle `surface` shifts.
*   **Don't** use pure black (#000000) for text. Always use `on-surface` (#191c1e) to maintain the premium navy undertone.
*   **Don't** use standard "drop shadows." If the element doesn't feel like it's naturally floating due to tonal shifts, rethink the layering.
*   **Don't** use high-saturation reds for errors. Use the `error` (`#ba1a1a`) and `error_container` tokens to ensure the "Premium" feel isn't broken by jarring, "cheap" colors.