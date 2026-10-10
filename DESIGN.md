# IdeaConnect — Premium Bento/Dashboard UI/UX Redesign

## 🎯 Executive Summary

**Product:** IdeaConnect — AI-powered collaborative innovation platform  
**Design Direction:** Premium Bento/Dashboard (Apple-tier / Linear-tier)  
**Motion Intensity:** Cinematic (9-10) — GSAP scroll choreography, magnetic physics, scroll-driven choreography  
**Scope:** Full redesign — Design System + Component Library + All 20+ Pages  
**Stack:** React 19 + Vite + Tailwind v4 + Motion (Framer Motion) + GSAP + TanStack Query + Zustand  

---

## 🎨 Design System Definition

### 1. Color System (Three-Layer Token Architecture)

```css
/* PRIMITIVES - Raw Values */
--color-violet-600: #7C3AED;    /* Primary brand */
--color-violet-700: #6D28D9;    /* Primary hover */
--color-violet-500: #A78BFA;    /* Secondary/Glass */
--color-cyan-500: #06B6D4;      /* Accent/CTA - AI cyan */
--color-cyan-600: #0891B2;      /* Accent hover */
--color-emerald-500: #10B981;   /* Success */
--color-amber-500: #F59E0B;     /* Warning */
--color-rose-500: #F43F5E;      /* Error/Destructive */

/* SEMANTIC - Purpose Aliases */
--color-primary: var(--color-violet-600);
--color-primary-hover: var(--color-violet-700);
--color-primary-muted: var(--color-violet-500);
--color-accent: var(--color-cyan-500);
--color-accent-hover: var(--color-cyan-600);
--color-success: var(--color-emerald-500);
--color-warning: var(--color-amber-500);
--color-destructive: var(--color-rose-500);

/* COMPONENT - Component Specific */
--button-primary-bg: var(--color-primary);
--button-primary-hover: var(--color-primary-hover);
--button-accent-bg: var(--color-accent);
--button-accent-hover: var(--color-accent-hover);
--card-bg: #FFFFFF;
--card-border: #DDD6FE;
--input-border: #DDD6FE;
--focus-ring: var(--color-primary);
```

**Dark Mode Palette:**
```css
[data-theme="dark"] {
  --color-background: #0F0F23;
  --color-foreground: #F8FAFC;
  --color-card: #1E1D35;
  --color-card-foreground: #F8FAFC;
  --color-muted: #27273B;
  --color-muted-foreground: #94A3B8;
  --color-border: #4C1D95;
  --color-card-border: #4338CA;
}
```

### 2. Typography System

| Role | Font | Scale | Weight | Usage |
|------|------|-------|--------|-------|
| **Display/Headline** | Space Grotesk | 56px/72px (hero), 40px/48px (H2), 32px/40px (H3) | 600-700 | Hero, Section headers |
| **Subhead/Label** | Space Grotesk | 18px/24px | 500 | Section eyebrows, card titles |
| **Body/Paragraph** | DM Sans | 16px/24px (base), 14px/20px (sm) | 400/500 | Body copy, descriptions |
| **Data/Metrics** | Space Grotesk (mono) | 16px/24px | 500-600 | Stats, KPIs, code |
| **UI Labels/Captions** | DM Sans | 12px/16px | 500 | Form labels, badges, meta |

**Font Loading:** Self-hosted via Vite plugin, `font-display: swap`

### 3. Spacing & Layout Tokens

```css
/* Spacing Scale (4px base) */
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
--space-5: 20px;  --space-6: 24px;  --space-8: 32px;  --space-10: 40px;
--space-12: 48px; --space-16: 64px; --space-20: 80px; --space-24: 96px;

/* Layout */
--container-max: 1400px;
--header-height: 64px;
--sidebar-width: 280px;
--card-radius: 16px;      /* Rounded-xl */
--card-radius-lg: 24px;   /* Rounded-2xl for bento cards */
--input-radius: 10px;

/* Elevation/Shadows */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
--shadow-md: 0 4px 12px rgba(0,0,0,0.08);
--shadow-lg: 0 12px 32px rgba(0,0,0,0.12);
--shadow-glass: 0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1);
```

### 3. Motion Tokens (Cinematic 9-10)

```css
/* Duration Scale */
--duration-instant: 100ms;
--duration-fast: 200ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
--duration-cinematic: 800ms;
--duration-epic: 1200ms;

/* Easing Curves (Custom Cubic-Bezier) */
--ease-spring: cubic-bezier(0.32, 0.72, 0, 1);      /* Main brand easing */
--ease-spring-sharp: cubic-bezier(0.4, 0, 0.2, 1);  /* Sharp exits */
--ease-expo: cubic-bezier(0.16, 1, 0.3, 1);         /* Fluid entries */
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);   /* Playful */

/* Motion Intensity: 9-10 (Cinematic) */
--motion-entry-delay: 100ms;      /* Stagger base */
--motion-stagger: 80ms;           /* Per-item stagger */
--motion-parallax-depth: 0.15;    /* Parallax factor */
--motion-magnetic-radius: 80px;   /* Magnetic button radius */
```

---

## 🧱 Component Library Architecture

### Core Primitive Components

| Component | States | Motion Spec | Notes |
|-----------|--------|-------------|-------|
| **Button** | default, hover, active, loading, disabled, focus-visible | Magnetic (scale 0.98, translate), trail icon morph | Primary, Secondary, Ghost, Destructive, Link variants |
| **Card** | default, hover, loading, selected, error | Double-bezel (outer shell + inner core), lift on hover (scale 1.01, shadow-lg) | Double-bezel architecture mandatory |
| **Input** | default, focus, error, disabled, filled | Label float animation, error shake | Label float on focus/filled |
| **Avatar** | default, with status ring, stackable | Pulse on status change | Stacked group with overlap |
| **Badge** | default, dot, removable, clickable | Pulse on count change | Dot pulse animation |
| **Dropdown/Menu** | open, closing, item hover | Staggered mask reveal (100ms stagger) | GSAP mask reveal |
| **Modal/Drawer** | entering, open, closing | Backdrop blur + scale + stagger | Backdrop-blur-3xl, stagger 100ms |
| **Toast/Notification** | enter, exit, progress | Slide from right, progress bar | Magnetic dismiss |
| **Tabs** | active, hover, focus | Indicator slide (spring) | Motion indicator |
| **Table/DataGrid** | row hover, sort, filter, select | Row highlight, skeleton loading | Virtualized for >100 rows |
| **AvatarStack** | default, max-3, overflow | Overlap stagger | -4px overlap, +1 per additional |

### Advanced/Cinematic Components

| Component | Motion Spec (Cinematic 9-10) |
|-----------|------------------------------|
| **MagneticButton** | `useMotionValue` + `useTransform` — cursor follows within 80px radius, scale 0.98 on press, trail icon translates diagonally + scales |
| **StickyStack** | GSAP ScrollTrigger — `start: "top top"`, `pin: true`, `pinSpacing: false`, scale 0.92 + opacity 0.55 on previous card |
| **HorizontalPan** | GSAP horizontal scroll-hijack — `start: "top top"`, `end: "+=distance"`, `pin: true`, `scrub: 1` |
| **HorizontalMarquee** | GSAP infinite horizontal scroll — `duration: 30s`, `ease: "none"`, `repeat: -1` |
| **MagneticNav** | Floating glass pill (`mt-6`, `rounded-full`), hamburger morphs to X (rotate 45°/-45°), modal expansion with staggered mask reveal (100ms stagger) |
| **ScrollRevealStagger** | Motion `whileInView` — `translate-y-16 blur-md opacity-0` → `translate-y-0 blur-0 opacity-100`, 800ms, stagger 80ms |
| **MagneticButton** | `useMotionValue` cursor tracking within 80px, button follows cursor, inner icon translates + scales |
| **GlassCard** | Double-bezel: outer shell (backdrop-blur-2xl, ring-white/10, p-1.5, rounded-2xl) + inner core (bg-white/80, inset shadow, rounded-[calc(2rem-0.375rem)]) |
| **ScrollProgress** | Top bar + circular indicator, GSAP scrub linked to scroll progress |

---

## 📄 Page-by-Page Redesign Specs

### 1. Home/Landing Page (`/`)

**Layout Archetype:** Editorial Split + Asymmetric Bento  
**Vibe:** AI-Native UI  

| Section | Layout | Motion Spec | Key Changes |
|---------|--------|-------------|-------------|
| **Hero** | Editorial Split (left: typography, right: interactive demo) | `StickyStack` hero — pin at top, next section scrubs previous card to 0.92 scale | Split 60/40, animated gradient orbs, real AI demo iframe |
| **Stats Bar** | 4-column KPI cards | `ScrollRevealStagger` (delay 100ms, stagger 80ms) | Animated counters (count-up on scroll) |
| **Features** | Asymmetric Bento (2x2 + 1x2) | Bento hover lift (1.02), stagger entry | Real screenshots, not placeholder cards |
| **Social Proof** | HorizontalMarquee (logos) | GSAP infinite horizontal scroll, pauses on hover | Real SVG logos from Simple Icons |
| **Testimonials** | Horizontal scroll-snap cards | GSAP HorizontalPan (scroll-hijack) | 3-dot pagination, keyboard nav |
| **CTA Section** | Centered, glassmorphism card | GlassCard double-bezel, magnetic CTA | Magnetic CTA with trail icon |

**Motion Choreography:**
- Hero: `StickyStack` pin at viewport top, next section scrubs hero to 0.92 scale
- Feature cards: `ScrollRevealStagger` (delay 100ms, stagger 80ms, `translate-y-16 blur-md`)
- Stats: Count-up animation on scroll intersect
- Logos: `HorizontalMarquee` — 30s infinite, pause on hover
- Testimonials: `HorizontalPan` scroll-hijack (pin at top, scrub 1)

### 2. Dashboard (`/dashboard`)

**Layout Archetype:** Data-Dense Dashboard + Asymmetric Bento  
**Vibe:** Data-Dense Dashboard + Bento Box Grid hybrid  

| Section | Layout | Motion Spec | Key Changes |
|---------|--------|-------------|-------------|
| **Header** | Sticky glass pill nav | MagneticNav — floating pill, hamburger morph | Floating glass pill detached from top (`mt-6`) |
| **Stats Grid** | 4 KPI cards (bento) | StickyStack — pin, next scrubs previous to 0.92 scale | GlassCard double-bezel, animated counters |
| **Activity Feed** | Vertical list + horizontal scroll | `HorizontalPan` for horizontal sections | Real-time updates via socket |
| **Projects** | Bento grid (asymmetric) | Bento hover lift (1.02), stagger entry | Convert to Project CTA magnetic |
| **Ideas** | Bento grid | StickyStack for detail view | AI Insights panel removed (AI removed) |
| **Tasks** | Kanban board (TaskBoard) | Drag animations, column reorder | Framer Motion layout animations |
| **Recommendations** | Horizontal scroll-snap | `HorizontalPan` | Real heuristic recommendations |

**Cinematic Dashboard Motions:**
- Stats cards: `StickyStack` — pin at top, next section scrubs to 0.92 scale + 0.55 opacity
- Activity feed: `ScrollRevealStagger` with 80ms stagger
- Project cards: Bento hover lift (1.02 scale, shadow-lg), magnetic CTA
- Kanban: Framer Motion `layout` + `layoutId` for drag reorder
- Real-time updates: Toast slide-in from top-right, progress ring

### 3. Ideas Pages

| Page | Layout | Motion Spec |
|------|--------|-------------|
| **`/ideas` (Browse)** | Bento grid + sidebar filters | `ScrollRevealStagger` for cards, filter sidebar slide-in |
| **`/ideas/:id` (Detail)** | Editorial Split (left: content, right: actions) | `StickyStack` for detail, `StickyStack` for comments |
| **`/ideas/new`** | Editorial Split (form + preview) | Real-time preview sync, magnetic CTA |
| **`/ideas/bookmarks`** | Bento grid | `ScrollRevealStagger` |

**Key Motions:**
- Idea cards: `ScrollRevealStagger` (80ms stagger), hover lift 1.02
- Detail page: `StickyStack` — sidebar pins, content scrolls
- Create: Real-time preview (debounced 300ms), magnetic "Create" CTA

### 4. Projects Pages

| Page | Layout | Motion Spec |
|------|--------|-------------|
| **`/projects`** | Bento + list toggle | View toggle animation (grid ↔ list) |
| **`/projects/:id`** | Z-Axis Cascade (project header + tabs) | Tab indicator spring, tab content `ScrollRevealStagger` |
| **`/projects/:id/tasks`** | Kanban (TaskBoard) | Framer Motion `layout` + `layoutId` for drag |

### 4. Profile & Settings

| Page | Layout | Motion Spec |
|------|--------|-------------|
| **`/profile`** | Editorial Split (avatar + tabs) | Tab indicator spring, avatar upload preview |
| **`/settings`** | Vertical tabs + panels | Panel slide (x-axis), form validation shake |
| **`/users/:id`** | Editorial Split | Same as profile, read-only |

### 5. Chat & Teams

| Page | Layout | Motion Spec |
|------|--------|-------------|
| **`/chat`** | Split view (sidebar + conversation) | Message `layout` animations, typing indicator pulse |
| **`/chat/:id`** | Split view + message list | Message `layout` + `layoutId`, optimistic UI |
| **`/teams`** | Bento grid | Card hover lift, magnetic "Join" CTA |
| **`/teams/:id`** | Split (members + chat) | Same as chat |

### 6. Search (`/search`)

**Layout:** Editorial Split (left: filters, right: results)  
**Motion:** Results `ScrollRevealStagger`, filter panel slide-in, `HorizontalMarquee` for trending searches

### 7. Auth Pages

| Page | Layout | Motion Spec |
|------|--------|-------------|
| **`/login`** | Centered glass card | GlassCard double-bezel, magnetic CTA, label float |
| **`/register`** | Centered glass card | Label float, password strength meter (animated) |
| **`/forgot-password`** | Centered glass card | Email sent confirmation animation |
| **`/reset-password/:token`** | Centered glass card | Password match indicator (real-time) |
| **`/verify-email/:token`** | Centered glass card | Success checkmark animation (Lottie/GSAP) |

### 8. Admin Panel

**Layout:** Data-Dense Dashboard (sidebar + content)  
**Motion:** Table row hover, modal slide-in, tab indicator spring

### 9. Notifications & Bookmarks

**Layout:** Bento grid + list toggle  
**Motion:** Toggle animation, `ScrollRevealStagger`

---

## 🎬 Cinematic Motion Implementation Guide

### GSAP Scroll Choreography (Core)

```javascript
// 1. StickyStack - Hero pin + card stack
gsap.registerPlugin(ScrollTrigger);

export function StickyStack({ cards }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  
  useEffect(() => {
    if (reduce || !ref.current) return;
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray(".stack-card");
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return;
        ScrollTrigger.create({
          trigger: card,
          start: "top top",
          endTrigger: cards[cards.length - 1],
          end: "top top",
          pin: true,
          pinSpacing: false,
        });
        gsap.to(card, {
          scale: 0.92,
          opacity: 0.55,
          ease: "none",
          scrollTrigger: {
            trigger: cards[i + 1],
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, [reduce]);
}

// 2. HorizontalPan - Scroll hijack horizontal scroll
export function HorizontalPan({ children }) {
  const wrap = useRef(null);
  const track = useRef(null);
  const reduce = useReducedMotion();
  
  useEffect(() => {
    if (reduce || !wrap.current || !track.current) return;
    const ctx = gsap.context(() => {
      const distance = track.current.scrollWidth - window.innerWidth;
      gsap.to(track.current, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: wrap.current,
          start: "top top",
          end: () => `+=${distance}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, wrap);
    return () => ctx.revert();
  }, [reduce]);
  
  return (
    <section ref={wrap} className="relative overflow-hidden">
      <div ref={track} className="flex h-[100dvh] items-center">
        {children}
      </div>
    </section>
  );
}

// 3. HorizontalMarquee - Infinite logo scroll
export function HorizontalMarquee({ items }) {
  const track = useRef(null);
  const reduce = useReducedMotion();
  
  useEffect(() => {
    if (reduce || !track.current) return;
    const ctx = gsap.context(() => {
      gsap.to(track.current, {
        xPercent: -100,
        ease: "none",
        duration: 30,
        repeat: -1,
        modifiers: { xPercent: (x) => `${parseFloat(x) % 100}%` },
      });
    }, track);
    return () => ctx.revert();
  }, [reduce]);
  
  return (
    <div className="relative overflow-hidden" ref={track}>
      <div className="flex whitespace-nowrap" style={{ animation: 'none' }}>
        {items.map((item, i) => <div key={i} className="flex-shrink-0 px-8">{item}</div>)}
        {items.map((item, i) => <div key={`${i}-clone`} className="flex-shrink-0 px-8">{item}</div>)}
      </div>
    </div>
  );
}
```

### Magnetic Button (Cinematic 9-10)

```jsx
"use client";
import { useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, useReducedMotion } from "motion/react";

export function MagneticButton({ 
  children, 
  trailingIcon, 
  onClick, 
  className = "", 
  ...props 
}) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const reduce = useReducedMotion();
  const radius = 80; // Magnetic radius in pixels
  
  useEffect(() => {
    if (reduce || !ref.current) return;
    const el = ref.current;
    
    const onMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / radius;
      const dy = (e.clientY - cy) / radius;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) {
        x.set(dx * 12);
        y.set(dy * 12);
      } else {
        x.set(0);
        y.set(0);
      }
    };
    
    const onMouseLeave = () => {
      x.set(0);
      y.set(0);
    };
    
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseleave", onMouseLeave);
    return () => {
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [reduce]);
  
  const tx = useTransform(x, (v) => `${v}px`);
  const ty = useTransform(y, (v) => `${v}px`);
  const iconTx = useTransform(x, (v) => `${v * 1.5}px`);
  const iconTy = useTransform(y, (v) => `${v * 1.5}px`);
  const iconScale = useTransform(x, (v) => 1 + Math.abs(v) * 0.05);
  
  return (
    <motion.button
      ref={ref}
      style={{ x: tx, y: ty }}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-full px-6 py-3 
        bg-primary-600 text-white font-medium
        active:scale-[0.98] transition-transform duration-75
        ${className}`}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {trailingIcon && (
          <motion.span
            style={{ x: iconTx, y: iconTy, scale: iconScale }}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 
              flex items-center justify-center"
          >
            {trailingIcon}
          </motion.span>
        )}
      </span>
    </motion.button>
  );
}
```

### MagneticNav (Cinematic 9-10)

```jsx
"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { gsap } from "gsap";
import { Menu, X } from "lucide-react";

export function MagneticNav({ links, brand }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef(null);
  const reduce = useReducedMotion();
  
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  
  return (
    <>
      {/* Closed State - Floating Glass Pill */}
      <AnimatePresence>
        {!open && (
          <motion.nav
            ref={navRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 
              w-max rounded-full px-6 py-3
              bg-white/80 dark:bg-zinc-950/80
              backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10
              shadow-[0_8px_32px_rgba(0,0,0,0.12)]`}
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
          >
            <div className="flex items-center gap-4 px-2">
              <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                <span className="text-primary-600">Idea</span><span className="text-gray-900">Connect</span>
              </Link>
              <div className="hidden md:flex items-center gap-1">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-1.5 rounded-full text-sm font-medium
                      text-gray-600 hover:text-primary-600 hover:bg-primary-50
                      dark:text-gray-300 dark:hover:text-primary-400 dark:hover:bg-primary-950/20
                      transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpen(true)}
                className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
                aria-label="Open menu"
              >
                <HamburgerMorph isOpen={false} />
              </motion.button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
      
      {/* Open State - Full Screen Modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-3xl"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-3xl rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.3)] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-800">
                  <h2 className="text-xl font-bold">Navigation</h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                    aria-label="Close menu"
                  >
                    <HamburgerMorph isOpen={true} />
                  </motion.button>
                </div>
                <nav className="p-6 space-y-4">
                  {links.map((link, i) => (
                    <motion.link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      initial={false}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ 
                        delay: i * 0.06, 
                        duration: 0.5, 
                        ease: [0.16, 1, 0.3, 1] 
                      }}
                      className="block px-4 py-3 text-lg font-medium text-gray-700 dark:text-gray-200
                        hover:text-primary-600 dark:hover:text-primary-400
                        rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/20
                        transition-colors"
                    >
                      {link.label}
                    </motion.link>
                  ))}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Hamburger Morph - fluid X formation
function HamburgerMorph({ isOpen }) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" className="text-gray-700 dark:text-gray-200">
      <motion.path
        d={isOpen ? "M6 6l12 12M18 6l-12 12" : "M4 6h16M4 12h16M4 18h16"}
        initial={false}
        animate={isOpen ? { pathLength: 1 } : { pathLength: 1 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
```

---

## 📦 Implementation Phases

### Phase 0: Foundation (Week 1)
| Task | Deliverable | Dependencies |
|------|-------------|--------------|
| Design system tokens JSON | `design-tokens.json` + `tokens.css` | — |
| Tailwind v4 config with tokens | `tailwind.config.ts` + CSS variables | Tokens |
| Font loading setup | `next/font` equivalent via Vite plugin | Fonts selected |
| Icon library setup | `@phosphor-icons/react` installed | — |
| Base component primitives | Button, Card, Input, Badge, Avatar, Dropdown | Tokens |
| GlassCard, MagneticButton, MagneticNav | Core cinematic components | Core primitives |
| StickyStack, HorizontalPan, HorizontalMarquee | GSAP scroll components | GSAP installed |
| MagneticButton, MagneticNav | Cinematic interaction components | GSAP + Motion |

### Phase 1: Design System + Core Layout (Week 2)
| Task | Deliverable |
|------|-------------|
| Layout components | MainLayout (MagneticNav + GlassCard), AuthLayout |
| App shell | AppRoutes with lazy-loaded routes (`React.lazy`) |
| Global providers | QueryClient, Toaster, AuthProvider, SocketProvider |
| Dark mode toggle | Persisted in localStorage, system preference default |
| Global styles | index.css with design tokens, scrollbar-hide utilities |

### Phase 2: Landing + Auth (Week 3)
| Page | Priority | Key Motions |
|------|----------|-------------|
| Home (`/`) | P0 | StickyStack hero, HorizontalMarquee logos, HorizontalPan testimonials, StickyStack stats |
| Login (`/login`) | P0 | GlassCard, MagneticButton, label float |
| Register (`/register`) | P0 | Label float, password strength meter |
| Forgot Password | P1 | Email sent animation |
| Reset Password | P1 | Real-time match indicator |
| Verify Email | P1 | Success checkmark animation |

### Phase 3: Core App Pages (Week 3-4)
| Page | Priority | Key Motions |
|------|----------|-------------|
| Dashboard | P0 | StickyStack stats, HorizontalPan activity, Bento hover, StickyStack detail |
| Ideas Browse | P0 | ScrollRevealStagger cards, filter slide-in |
| Idea Detail | P0 | StickyStack sidebar, ScrollRevealStagger comments |
| Create Idea | P0 | Real-time preview, magnetic CTA |
| Projects Browse | P0 | Bento grid, view toggle animation |
| Project Detail | P0 | Z-Axis Cascade tabs, HorizontalPan tasks |
| Create Project | P0 | Real-time preview |

### Phase 4: Core Features (Week 4-5)
| Feature | Priority | Key Motions |
|---------|----------|-------------|
| Ideas CRUD | P0 | Optimistic UI, toast slide-in |
| Projects CRUD | P0 | Kanban drag (Framer Motion layout) |
| Chat | P0 | Message layout animations, typing pulse |
| Teams | P1 | Card hover lift, magnetic "Join" CTA |
| Profile | P1 | Tab indicator spring, avatar upload preview |
| Settings | P1 | Panel slide, form validation shake |
| Search | P1 | Results stagger, filter slide-in |
| Notifications | P1 | Badge pulse, mark-read animation |
| Admin Panel | P2 | Table row hover, modal slide-in |

### Phase 5: Polish & Production (Week 6)
| Task | Deliverable |
|------|-------------|
| Accessibility audit | axe-core + manual keyboard testing |
| Performance audit | Lighthouse CI, bundle analysis |
| Cross-browser testing | Chrome, Firefox, Safari, Edge |
| Mobile testing | iOS Safari, Chrome Android, responsive breakpoints |
| Reduced motion testing | All cinematic motions collapse to static |
| Dark mode audit | All pages in both modes |
| Bundle optimization | Code splitting, lazy routes, tree shaking |
| Documentation | Storybook for component library |

---

## 🎯 Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Tailwind v4 + CSS Variables** | Token-driven theming, dark mode native, no runtime overhead |
| **Motion (Framer Motion) + GSAP** | Motion for React-friendly declarative animations, GSAP for scroll choreography |
| **GSAP ScrollTrigger** | Only for scroll-hijack/sticky-stack; Motion for declarative UI animations |
| **React.lazy + Suspense** | Route-level code splitting, all routes lazy-loaded |
| **TanStack Query v5** | Server state, caching, optimistic updates |
| **Zustand** | Client state (auth, UI) — minimal, no provider wrapper needed |
| **Socket.io** | Real-time notifications, chat, presence |
| **Axios + Interceptors** | Auth, refresh token rotation, error handling |
| **React Hook Form + Zod** | Form validation, type-safe schemas |
| **React Hot Toast** | Toast notifications, accessible |
| **Lucide React** (existing) | Replaced with Phosphor Icons in new components |

---

## ♿ Accessibility & Performance Targets

| Metric | Target | Verification |
|--------|--------|--------------|
| **WCAG AA Contrast** | 4.5:1 normal, 3:1 large | axe-core + manual |
| **Focus Visible** | All interactive elements | Keyboard navigation test |
| **Reduced Motion** | All cinematic motions collapse to static | `prefers-reduced-motion` test |
| **Touch Targets** | ≥44×44px (iOS), ≥48×48dp (Android) | Mobile device test |
| **LCP** | < 2.5s | Lighthouse CI |
| **INP** | < 200ms | Lighthouse CI |
| **CLS** | < 0.1 | Lighthouse CI |
| **Bundle Size** | < 200KB gzipped (initial) | Vite bundle analyzer |
| **Dark Mode** | All pages in both modes | Manual + automated |

---

## 🔧 File Structure (New)

```
frontend/src/
├── design-system/
│   ├── tokens.json
│   ├── tokens.css
│   └── tailwind.config.ts
├── components/
│   ├── primitives/
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Input/
│   │   ├── Badge/
│   │   ├── Avatar/
│   │   ├── Dropdown/
│   │   ├── Modal/
│   │   ├── Toast/
│   │   └── index.ts
│   ├── cinematic/
│   │   ├── MagneticButton/
│   │   ├── MagneticNav/
│   │   ├── GlassCard/
│   │   ├── StickyStack/
│   │   ├── HorizontalPan/
│   │   ├── HorizontalMarquee/
│   │   ├── ScrollRevealStagger/
│   │   ├── MagneticButton/
│   │   └── index.ts
│   ├── layout/
│   │   ├── MainLayout/
│   │   ├── AuthLayout/
│   │   └── index.ts
│   └── index.ts
├── hooks/
│   ├── useReducedMotion.ts
│   ├── useScrollProgress.ts
│   └── index.ts
├── styles/
│   ├── globals.css
│   ├── motion-tokens.css
│   └── design-tokens.css
├── pages/
│   ├── Home/
│   ├── Dashboard/
│   ├── Ideas/
│   ├── Projects/
│   ├── Profile/
│   ├── Settings/
│   ├── Chat/
│   ├── Teams/
│   ├── Search/
│   ├── Admin/
│   └── Auth/
└── styles/
    └── globals.css
```

---

## 📋 Pre-Delivery Checklist (Per Page)

- [ ] No emojis as icons (use Phosphor Icons)
- [ ] All icons consistent family (Phosphor Light)
- [ ] No generic borders/shadows (double-bezel on cards)
- [ ] No `linear`/`ease-in-out` transitions (custom cubic-bezier)
- [ ] No static hero — `StickyStack` or `ScrollRevealStagger`
- [ ] Layout collapses to single-column `< 768px`
- [ ] All animations use `transform`/`opacity` only
- [ ] `backdrop-blur` only on fixed/sticky elements
- [ ] No arbitrary `z-50`/`z-[9999]` (systemic scale)
- [ ] `prefers-reduced-motion` honored (all cinematic collapses)
- [ ] Dark mode tested (all pages)
- [ ] Touch targets ≥44×44px
- [ ] Focus visible on all interactive elements
- [ ] Copy audit: no AI hallucination phrases
- [ ] No fake data/precise numbers without source
- [ ] Lighthouse CI: LCP < 2.5s, INP < 200ms, CLS < 0.1

---

## 🚀 Next Steps

1. **Phase 0 Complete** → Begin Phase 1 implementation
2. **Design system tokens review** → Confirm color palette, typography, spacing
3. **Component library priority** → Confirm which cinematic components to build first
4. **Page priority order** → Confirm page implementation sequence

**Estimated Timeline:** 6 weeks for full redesign with cinematic motion
**Team Size:** 1-2 frontend engineers (plan designed for solo execution with clear phases)