---
name: Flashcards
description: Mobile-first flashcards PWA for low-friction spaced-repetition study.
colors:
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  primary: "oklch(0.205 0 0)"
  primary-foreground: "oklch(0.985 0 0)"
  secondary: "oklch(0.97 0 0)"
  secondary-foreground: "oklch(0.205 0 0)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  accent: "oklch(0.97 0 0)"
  accent-foreground: "oklch(0.205 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
  destructive-foreground: "oklch(0.985 0 0)"
  border: "oklch(0.922 0 0)"
  input: "oklch(0.922 0 0)"
  ring: "oklch(0.708 0 0)"
typography:
  display:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  input-default:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
---

# Design System: Flashcards

## 1. Overview

**Creative North Star: "The Quiet Study Desk"**

Flashcards is a restrained product interface for short, repeatable study sessions. The surface should feel like a cleared desk: almost invisible when the user is focused, dependable when they need guidance, and never louder than the learning task.

The system uses neutral OKLCH tokens, compact spacing, system typography, and familiar product controls. It must support mobile-first use without turning study into entertainment. The visual language rejects the overly gamified or childish education app: no toy-like rewards, no busy mascot UI, no dopamine-feed patterns.

**Key Characteristics:**

- Restrained neutral palette with one primary action voice.
- Touch-friendly, calm, direct components.
- Compact forms and centered study surfaces.
- Familiar controls over invented affordances.
- Accessibility defaults: contrast, focus visibility, semantics, and reduced-motion-safe interactions.

## 2. Colors

The palette is grayscale-neutral and functional: white surfaces, near-black text, quiet secondary fills, and red only for destructive/error states.

### Primary

- **Desk Ink**: The primary action and strongest text color. Use for submit buttons, active decisions, and high-emphasis UI only.

### Secondary

- **Quiet Surface**: A pale neutral layer for secondary controls, muted areas, and low-emphasis backgrounds.

### Neutral

- **Clear Page**: The main background surface. Keep it clean and untextured.
- **Readable Ink**: The default foreground for body copy and interface text.
- **Soft Divider**: The border and input stroke color for calm structure without heavy boxes.
- **Muted Note**: Supporting copy and secondary labels; confirm contrast before placing it on tinted or disabled surfaces.

### Tertiary

- **Study Error Red**: Reserved for errors and destructive feedback. Never use it as decoration.

### Named Rules

**The One Action Rule.** Primary color is for the current action, not decoration. If everything is emphasized, no study step is clear.

**The No-Toy Palette Rule.** Do not add candy colors, reward gradients, or playful confetti tones unless the product direction explicitly changes.

## 3. Typography

**Display Font:** system-ui with platform sans fallbacks  
**Body Font:** system-ui with platform sans fallbacks  
**Label/Mono Font:** none distinct

**Character:** The type system is native, compact, and practical. It should feel like product infrastructure, not a marketing voice.

### Hierarchy

- **Display** (600, 2.25rem, 1.1 line-height): Reserved for simple page-level statements such as signed-in or empty-home states.
- **Headline** (600, 1.5rem, 1.2 line-height): Used for auth and focused task screens.
- **Title** (600, 1.125rem–1.25rem, tight line-height): Use for small panels or grouped content when needed.
- **Body** (400, 1rem, 1.5 line-height): Default explanatory copy; cap longer prose around 65–75ch.
- **Label** (500, 0.875rem, 1 line-height): Form labels and compact control text.

### Named Rules

**The Native Clarity Rule.** Use one sans family across UI. Do not introduce display fonts for labels, buttons, data, or study controls.

## 4. Elevation

Flashcards is flat by default. Depth is conveyed primarily through spacing, borders, and tonal surfaces. Shadows appear only as state feedback on controls or to clarify a lifted interactive surface; they should remain tight and subtle.

### Shadow Vocabulary

- **Control Lift** (`shadow` / `shadow-sm` Tailwind defaults): Used on buttons and inputs as a minimal tactile hint. Avoid combining decorative borders with wide soft shadows.

### Named Rules

**The Flat Study Rule.** Resting surfaces stay flat. If a shadow does not communicate interactivity or state, remove it.

## 5. Components

### Buttons

Touch-friendly, calm, direct controls with consistent height and radius.

- **Shape:** Gently rounded rectangle (8px radius).
- **Primary:** Desk Ink background with near-white text, 36px height, 16px horizontal padding.
- **Hover / Focus:** Hover slightly tones the background; focus uses a visible 1px ring token.
- **Secondary / Ghost / Link:** Secondary uses the quiet neutral surface; ghost buttons remain visually silent until hover; links use underline on hover only.

### Cards / Containers

No dedicated card component is established yet. Use flat tonal surfaces before adding cards. If a container is needed, keep it simple: neutral background, 8–10px radius, optional 1px border, no decorative shadow stack.

### Inputs / Fields

- **Style:** Transparent background, 1px Soft Divider border, 8px radius, 36px height, 12px horizontal padding.
- **Focus:** Replace ambiguity with the ring token; no animated glow or color flourish.
- **Error / Disabled:** Error text uses Study Error Red. Disabled controls reduce opacity and block interaction.

### Navigation

No persistent navigation pattern is implemented yet. When introduced, it should use the same compact system typography and quiet active states as the form controls.

## 6. Do's and Don'ts

### Do:

- **Do** make the next study action visually obvious with one primary action per screen.
- **Do** preserve the compact 36px control height unless a mobile touch target needs more space.
- **Do** use the existing neutral OKLCH tokens before adding new hues.
- **Do** keep forms centered, short, and readable for mobile sessions.
- **Do** verify contrast for muted text and placeholders.

### Don't:

- **Don't** make Flashcards look like an overly gamified or childish education app.
- **Don't** add loud rewards, toy-like visuals, mascot-driven UI, confetti, or dopamine-feed patterns.
- **Don't** use gradient text, decorative glassmorphism, side-stripe borders, or repeating stripe/grid backgrounds.
- **Don't** invent custom form affordances where native expectations are clearer.
- **Don't** use decorative motion that does not communicate state.
