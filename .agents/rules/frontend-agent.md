---
trigger: always_on
---

# Frontend UI Design Rules

Apply these rules whenever designing, implementing, reviewing, or modifying UI.

## 1. Core Principles

* Prioritize **hierarchy, typography, spacing, colour, alignment, consistency, and responsiveness** before decorative effects.
* Every visual element must have a purpose. Do not add decorative elements, cards, borders, icons, badges, shadows, gradients, or animations without a clear reason.
* Do not make everything visually important. Primary content should stand out while secondary information becomes quieter.
* Prefer simple, intentional design over excessive visual effects.
* Reuse existing components, tokens, and visual patterns before introducing new ones.
* Avoid arbitrary one-off values when an existing design-system value can be reused.

## 2. Visual Hierarchy

* Establish a clear visual starting point on every page and section.
* Use **size, weight, colour, contrast, spacing, positioning, alignment, background, and depth** to create hierarchy.
* Do not rely on font size alone.
* Make important content stronger through weight, colour, size, contrast, or position.
* Make secondary content quieter through softer colour, lower contrast, lighter weight, or smaller size where appropriate.
* If everything competes equally for attention, reduce the visual weight of secondary elements.

## 3. Typography

* Treat typography as a system: **font family, size, weight, line-height, letter spacing, and colour** must work together.
* Choose fonts deliberately and keep the number of font families and weights limited.
* Prefer roughly **400–500** for normal text and **600–700** for emphasis; avoid very light weights for small text.
* Do not make headings unnecessarily large; use weight, colour, spacing, and position for emphasis.
* Maintain a consistent type scale. Source examples include **12, 14, 16, 18, 20, 24, 30, 36, 48px**.
* Body text can use around **1.5 line-height** and headings around **1.25** where appropriate.
* Small, bold, uppercase labels may be used for section structure instead of oversized headings.

## 4. Spacing & Layout

* Use a **consistent spacing scale** and reuse it across the application.
* Avoid arbitrary one-off spacing.
* Common source examples include **12, 14, 16, 18, 20, 24, 30, 36, 48px**.
* Start with more whitespace and reduce it where necessary rather than beginning with a cramped layout.
* Use spacing to communicate relationships: related elements closer, unrelated elements farther apart.
* Keep padding, gaps, and internal spacing consistent across similar components.
* Use a deliberate grid, consistent containers, and alignment lines.
* Do not position elements arbitrarily when the existing layout system can handle them.

## 5. Colour & Contrast

* Use colour to communicate hierarchy, attention, state, interaction, and grouping.
* Do not use strong colour everywhere; let neutral surfaces provide most of the base where appropriate.
* Avoid overly saturated colours, especially when they overpower buttons or large areas.
* Consider **hue, saturation, lightness, and perceived brightness**, not numerical colour values alone.
* Greys may be subtly tinted: blue for cooler greys, yellow/brown for warmer greys.
* Maintain a consistent temperature across neutral colours.
* Do not automatically use grey text on coloured backgrounds or simply reduce opacity; choose colours that relate appropriately to the background.
* Avoid weak contrast, especially light text on light images or bright backgrounds.

## 6. Borders & Radius

* Use **fewer borders**.
* Before adding a border, consider whether spacing, background colour, grouping, or subtle elevation can provide the separation instead.
* Use borders when they provide meaningful structure, separation, or affordance.
* Avoid excessive dividers and visual clutter.
* Keep border radius consistent across similar components.
* Do not give every component large rounded corners simply because the style is popular.

## 7. Shadows & Depth

* Use shadows primarily to communicate **elevation and depth**, not decoration.
* Keep shadow treatments consistent between similar elevation levels.
* Do not use random or unrelated shadows.
* Depth can also come from background colour, overlap, layering, spacing, and positioning.
* Use subtle treatments rather than heavy shadows where possible.

## 8. Backgrounds

* Use alternate backgrounds to separate sections when appropriate.
* Background colour can replace borders or heavy separators.
* Use branded, dark, or patterned backgrounds selectively.
* Do not make every section colourful.

## 9. Forms & Buttons

* Inputs need comfortable height and padding; source examples use approximately **40–48px** depending on context.
* Input width can communicate expected input length.
* Use subtle input backgrounds when they improve distinction without requiring heavy borders.
* Adapt browser-default controls when necessary so they fit the application's visual language.
* Establish clear button hierarchy: primary actions stronger, secondary actions quieter.
* Do not use full button treatments when a text link or lighter treatment is more appropriate.
* Avoid overly saturated or cramped buttons.
* Keep button and input dimensions visually compatible.

## 10. Icons

* Use icons only when they improve recognition, navigation, scanning, or interaction.
* Icons should not overpower nearby text.
* Reduce icon contrast or visual weight when necessary.
* Keep icon style, size, weight, colour, and spacing consistent.

## 11. Cards & Tables

### Cards

* Do not turn everything into a card.
* Avoid automatically combining borders + shadows + large radius on every card.
* Use typography, colour, spacing, and alignment to establish hierarchy within cards.
* Use badges when they help users identify information quickly.
* Do not add unnecessary labels.

### Tables

* Right-align comparable numeric values where appropriate.
* Align decimal places when useful.
* Use tabular numbers where appropriate: `font-feature-settings: "tnum";`
* Avoid excessive cell borders; use subtler separation or zebra striping where appropriate.

## 12. Responsive Design

* Consider mobile while designing the structure, not only after desktop implementation.
* Allow layouts to stack naturally where appropriate.
* Responsive changes may affect spacing, padding, font size, widths, and arrangement.
* Do not simply shrink desktop layouts; preserve hierarchy and readability.

## 13. Consistency & Existing UI

* Treat typography, spacing, colours, backgrounds, borders, radius, shadows, and components as one visual system.
* Before creating new UI, inspect existing components, tokens, styles, and patterns.
* Similar components should look and behave consistently unless there is a deliberate reason to differentiate them.
* When fixing a visual issue, check whether the same issue exists elsewhere and fix the underlying pattern instead of applying an isolated patch.
* When modifying an existing product, preserve its established visual language unless a redesign is explicitly requested.

## 14. Avoid Generic / Overdesigned UI

Do not equate modern UI with:

* excessive gradients
* excessive shadows
* huge typography
* huge rounded corners
* excessive cards
* decorative SVGs
* unnecessary icons
* excessive animations
* visual effects without purpose

Avoid “everything is a card” and “everything has the same visual weight” patterns.

Reusable components should provide consistency without destroying hierarchy.

## 15. Final UI Review

Before completing frontend work, check:

* **Typography:** family, size, weight, line-height, hierarchy
* **Spacing:** consistency, whitespace, padding, gaps
* **Colour:** hierarchy, saturation, neutrals, contrast
* **Borders:** necessity and consistency
* **Radius:** consistency
* **Shadows:** purpose and elevation
* **Components:** buttons, inputs, icons, cards, tables
* **Layout:** grid, alignment, content width
* **Responsive:** mobile behaviour and preserved hierarchy
* **Consistency:** matches existing application patterns
* **Complexity:** no unnecessary visual decoration

If something feels visually wrong, inspect **spacing, typography, hierarchy, alignment, colour, and visual weight first** before adding more effects.

## Core Rule

**Prefer hierarchy over decoration, consistency over arbitrary variation, whitespace over clutter, purposeful colour over excessive colour, meaningful separation over excessive borders, purposeful elevation over random shadows, and clarity over novelty.**
