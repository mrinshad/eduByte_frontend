# Design System & Token Standards — Frontend

This document defines the authoritative design tokens, visual hierarchy, typography, and component styling rules for the **eduByte Frontend**. All UI implementations must adhere to these specifications.

---

## 1. Brand Identity & Visual Language

eduByte's visual design is rooted in an institutional, dignified **Sage Green & Ivory** aesthetic.
- **Base Philosophy**: Clean, academic elegance with high-contrast functional surfaces.
- **Tone**: Professional, trustworthy, calm, structured.
- **Anti-Patterns**: Never introduce unprompted purple/pink gradients, heavy card borders, arbitrary rounded corners, or low-contrast text.

---

## 2. Color System & Design Tokens (OKLCH)

All colors are specified in the modern **OKLCH** color space and exposed via CSS variables in `frontend/app/globals.css`.

### 2.1 Light / Default Brand Palette
| Token | Variable | Value | Purpose / Usage |
| :--- | :--- | :--- | :--- |
| **Background** | `--background` | `oklch(0.46 0.04 125)` | Core Sage Green backdrop |
| **Foreground** | `--foreground` | `oklch(0.98 0.01 95)` | High-contrast Ivory/White primary text |
| **Card** | `--card` | `oklch(0.42 0.04 125)` | Deep Sage Green container surface |
| **Card Foreground**| `--card-foreground` | `oklch(0.98 0.01 95)` | Ivory text on cards |
| **Primary (CTA)** | `--primary` | `oklch(0.98 0.01 95)` | Ivory call-to-action button surface |
| **Primary Text** | `--primary-foreground`| `oklch(0.46 0.04 125)` | Sage text inside primary buttons |
| **Secondary** | `--secondary` | `oklch(0.52 0.04 125)` | Softer tint sage for secondary elements |
| **Muted** | `--muted` | `oklch(0.55 0.03 125)` | Subdued backgrounds |
| **Muted Text** | `--muted-foreground` | `oklch(0.88 0.02 125)` | Secondary labels and helper text |
| **Accent** | `--accent` | `oklch(0.98 0.01 95 / 15%)` | Subtle translucent overlay on hover/focus |
| **Border** | `--border` | `oklch(0.98 0.01 95 / 20%)` | Fine translucent structure line |
| **Input** | `--input` | `oklch(0.98 0.01 95 / 15%)` | Form field background fill |
| **Destructive** | `--destructive` | `oklch(0.62 0.22 25)` | Danger, error, void, student relieve actions |
| **Sidebar** | `--sidebar` | `oklch(0.42 0.04 125)` | Persistent navigation sidebar |

### 2.2 Dark Mode Palette
| Token | Variable | Value | Purpose / Usage |
| :--- | :--- | :--- | :--- |
| **Background** | `--background` | `oklch(0.145 0 0)` | Deep neutral dark backdrop |
| **Foreground** | `--foreground` | `oklch(0.985 0 0)` | Crisp white text |
| **Card** | `--card` | `oklch(0.205 0 0)` | Elevated dark container |
| **Primary** | `--primary` | `oklch(0.922 0 0)` | High-contrast light button |
| **Destructive** | `--destructive` | `oklch(0.704 0.191 22.2)` | Clear danger red |

---

## 3. Typography Scale & Fonts

The typography system pairs an editorial serif heading font with a crisp, geometric sans-serif for UI clarity.

- **Heading Font**: `Cormorant Garamond` (`--font-heading`, Serif) — used for modal headers, portal titles, and report headings.
- **Sans Font**: `Plus Jakarta Sans` (`--font-sans`, Sans-Serif) — used for all body text, tables, buttons, and form inputs.
- **Numeric Figures**: Always format financial numbers, fee amounts, and currency balances with tabular figures:
  ```css
  font-feature-settings: "tnum";
  ```

### Type Scale
| Level | Font Size | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | 32px / 2rem | 1.2 | SemiBold (600) | Main dashboard titles |
| **Heading 1** | 24px / 1.5rem | 1.25 | SemiBold (600) | Page headers |
| **Heading 2** | 20px / 1.25rem | 1.3 | Medium (500) | Card and modal titles |
| **Body (Base)**| 14px / 0.875rem | 1.5 | Regular (400) | Default text, forms, tables |
| **Small / Caption**| 12px / 0.75rem | 1.4 | Regular / Medium | Helper copy, badges, table meta |

---

## 4. Spacing, Radius & Elevation

### 4.1 Spacing Scale
Follow standard 4px baseline increments:
`4px (1)`, `8px (2)`, `12px (3)`, `16px (4)`, `24px (6)`, `32px (8)`, `48px (12)`.

### 4.2 Border Radius Scale
Base radius is defined as `1rem` (16px):
- `--radius-sm`: `calc(var(--radius) * 0.6)` (9.6px) — Badges, small pills
- `--radius-md`: `calc(var(--radius) * 0.8)` (12.8px) — Buttons, inputs
- `--radius-lg`: `var(--radius)` (16px) — Cards, dropdowns, dialogs
- `--radius-xl`: `calc(var(--radius) * 1.4)` (22.4px) — Large cards, popovers

---

## 5. Component Patterns & Guidelines

### 5.1 Buttons
- **Primary**: Solid ivory background (`--primary`) with sage green text (`--primary-foreground`).
- **Secondary**: Outlined or soft tinted background (`--secondary`).
- **Destructive**: Prominent red fill for irrevocable actions (e.g., student relieving, fee structure deletion).
- **Heights**: Consistent 40px standard control height (`h-10 px-4`).

### 5.2 Forms & Input Controls
- Semi-transparent tinted background (`bg-input/20 border-border`).
- Focused states must display a visible outline ring (`ring-ring ring-offset-2`).
- Numeric inputs remove spin buttons and enforce right alignment for monetary values.

### 5.3 Tables & Data Grids
- Clean borders without heavy drop-shadows.
- Right-align numeric columns (fees, dues, balances, head totals).
- Highlight statuses with semantic badges (e.g., `ACTIVE`, `RELIEVED`, `PAID`, `PARTIAL`, `UNPAID`).

---

## 6. Print & Receipt Standards

Receipts, fee challans, and salary slips follow dedicated print CSS:
- Target: A4 Portrait (`210mm` width).
- Hides all layout headers, navigation sidebars, action buttons, and toaster alerts via `.no-print`.
- Enforces `-webkit-print-color-adjust: exact` to preserve institutional headers and borders.
