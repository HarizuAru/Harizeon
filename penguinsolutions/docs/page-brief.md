# Penguin Solutions — Page Brief & Route Map

## Source & Destination
- **Source URL:** `https://www.penguinsolutions.com/` (redirects to `https://www.penguinsolutions.com/en-us`)
- **Local Route:** `/` (`src/app/page.tsx`)
- **Scope:** Full homepage clone (`https://www.penguinsolutions.com/en-us`). Outbound navigation links to internal sub-routes on `penguinsolutions.com` (e.g., `/en-us/products/...`, `/en-us/services/...`, `/en-us/contact-us`) are preserved as absolute `https://www.penguinsolutions.com/...` links so every link navigates to its real destination.
- **Asset Directory:** `penguinsolutions/assets/` (served at `/sites/penguinsolutions/[filename]` via `src/app/sites/penguinsolutions/[filename]/route.ts`)
- **Component Directory:** `penguinsolutions/components/`

## Design Tokens & Typography
- **Font Family:** `DM Sans` (weights `300`, `400`, `500`, `700`) via `next/font/google`, fallback `Arial, sans-serif`
- **Core Palette:**
  - Background Light 1: `#ffffff`
  - Background Light 2: `#f5f6f8`
  - Dark 1 (Hero, Platform, Process, Footer): `#242b2e` (`rgb(36, 43, 46)`)
  - Brand Yellow: `#ffcd30`
  - Text Primary: `#242b2e`
  - Text Secondary: `#3e4e53`
  - Text on Dark: `#ffffff` (headings), `#cccccc` / `#bcc3c7` (body)
  - Border Light: `#dce2e3`
  - Indicator Track: `#bcc3c7`, Active Indicator: `#ffcd30`
- **Container & Spacing:**
  - Max width: `90rem` (`1440px`)
  - Horizontal margin: `clamp(1rem, 0.4286rem + 2.857vw, 3rem)` (`16px` mobile → `48px` desktop)
  - Gutter: `clamp(1rem, 0.8571rem + 0.714vw, 1.5rem)` (`16px` → `24px`)
  - Section vertical padding: `clamp(4.5rem, 3.5rem + 5vw, 8rem)` (`72px` → `128px`)
  - Border radii: `24px` (`clamp(1rem, ... , 1.5rem)`) for cards/media, `12px` (`.75rem`) for primary/secondary buttons, `100vw` for pill tags and circle controls.
- **Type Scale:**
  - `h1` (Display): `clamp(3rem, 2.4286rem + 2.857vw, 5rem)` (`48px` → `80px`), weight `300`, line-height `1.1`, letter-spacing `-0.01em`
  - `h2`: `clamp(1.5rem, 1.214rem + 1.428vw, 2.5rem)` (`24px` → `40px`), weight `300`, line-height `1.2`, letter-spacing `-0.01em`
  - `h3` (Stat numbers / News): `clamp(1.375rem, 1.196rem + 0.893vw, 2rem)` (`22px` → `32px`) / `1.25rem` (`20px`)
  - Body: `clamp(0.875rem, 0.839rem + 0.179vw, 1rem)` (`14px` → `16px`), weight `400`, line-height `1.5`, letter-spacing `-0.01em`

## Section Map (Top to Bottom)
1. **Header (`SiteHeader.tsx`)**
   - Top utility bar (`32px` height): phone (`1-415-954-2800`), Support link, Language selector (`English`)
   - Main navbar (`88px` height): Penguin Solutions wordmark + yellow bar SVG, 7 mega-menu dropdowns (`What We Do`, `Solutions`, `Services`, `Company`, `Partners`, `Resources`, `Careers`), `Contact` link, Search trigger modal/panel, and mobile drawer (`<1024px`).
2. **Hero (`HeroSection.tsx`)**
   - Full-bleed dark `#242b2e` (`840px` desktop height), looping background video (`hero-bg.mp4`) with `hero-poster.avif` fallback and dark gradient scrim.
   - H1 `The AI Factory Platform Company`, subtitle, 4 bordered pill links (`Faster Time-to-First-Token`, `Validated AI Factory Architecture`, `End-to-End AI Factory Services`, `Best Token Economics & TCO`), yellow `Let's Talk` CTA button.
3. **NVIDIA Partner Banner (`StatsSection.tsx`)**
   - Light-2 (`#f5f6f8`) background, dark `#242b2e` rounded card (`24px`) with `4px` `#ffcd30` top accent border, 2-column text (`NVIDIA AI Factory Specialized Partner` | description).
4. **Global AI Data Centers & Stats (`StatsSection.tsx`)**
   - Light-2 (`#f5f6f8`), 2-column header, 3 white stat cards (`25+ Years Experience`, `100,000+ GPUs Deployed & Managed`, `4.2+ Billion Hours of GPU Runtime`).
5. **Full-Stack AI Factory Platform (`PlatformSection.tsx`)**
   - Dark-1 (`#242b2e`), eyebrow `Our Platform`, 2-column header, left 1:1 architecture diagram (`platform-diagram.webp`), right `#343c40` card with 5-item accordion (`1. ClusterWareAI™` open by default through `5. End-to-End Services`).
6. **Customers Trust Penguin Solutions (`CustomersSection.tsx`)**
   - Light-2 (`#f5f6f8`), eyebrow `Customer Stories`, left white card with 6 logo accordion items (`SK telecom`, `bp`, `Deepgram`, `Georgia Tech`, `Sandia National Labs`, `Shell`), right 1:1 rounded photo updating with active item.
7. **Industry Expertise Carousel (`IndustriesSection.tsx`)**
   - Light-1 (`#ffffff`), eyebrow `Industry Expertise`, horizontal draggable/button-controlled carousel of 12 industry cards (`320x400` image + title + arrow), bottom progress track (`#bcc3c7` / `#242b2e`) + Prev/Next circular buttons.
8. **AI Infrastructure Comprehensive Services (`ProcessSection.tsx`)**
   - Dark-1 (`#242b2e`), eyebrow `Our Process`, 2-column header, left `#0c0f10` card with 4-item accordion (`Design`, `Build`, `Deploy`, `Manage`) each with custom 48×48 SVG icon + yellow dot and yellow CTA button, right 1:1 photo updating with active step.
9. **Customer Testimonials Carousel (`TestimonialsSection.tsx`)**
   - Light-1 (`#ffffff`), `#f5f6f8` rounded container (`24px`) with 100×100 quote SVGs, 5-slide carousel (`Lektra`, `bp`, `Deepgram`, `Georgia Tech`, `Voltage Park`), bottom progress track + Prev/Next circular buttons.
10. **Our Products (`ProductsSection.tsx`)**
    - Light-2 (`#f5f6f8`), eyebrow `Our Products`, 2-tier interactive tabs:
      - Primary: `AI`, `Fault Tolerance`, `Memory`
      - Secondary (3 subtabs per primary tab)
      - Panel: 4:3 rounded product photo + white detail card with heading, paragraphs, and outlined `Discover ...` button.
11. **News Corner (`NewsSection.tsx`)**
    - Light-1 (`#ffffff`), eyebrow `News Corner`, horizontal carousel of all 36 News/Media/Blog cards (4 visible desktop), bottom progress track + Prev/Next circular buttons.
12. **Talk to Our Experts CTA (`ExpertsCtaSection.tsx`)**
    - Full-bleed looping video (`experts-bg.mp4`) with left-aligned frosted white card (`Request a Callback`, `Talk to Our Experts`, 2 paragraphs, yellow `Let's Talk` CTA).
13. **Footer (`SiteFooter.tsx`)**
    - Dark-1 (`#242b2e`), 4-column layout (`Company summary + social links`, `Get in touch`, `Partners`, `Company`), bottom legal bar (`© 2026 Penguin Solutions...`).
