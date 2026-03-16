# Impeccable Audit & Polish: Meridian BNPL

## 🔍 Technical Audit (/audit)

1. **A11y (Accessibility)**:
    - Many interactive elements (buttons, logos) lack explicit `aria-label` attributes.
    - Contrast ratios on text like "text-foreground/30" (on Ivory background) may be below WCAG AA standards.
    - Navigation between the 3 repos (Merchant App, Dashboard, Consumer App) is disconnected; no shared "header" or "service switcher" exists.

2. **Performance**:
    - `updateMUSDCBalance` runs every 5 seconds globally. Consider using a `Web3 Subscription` or only polling when the window is focused to save RPC credits.
    - Large images (logos in the terminal) should use standard `next/image` optimization with defined sizes to prevent layout shift.

3. **Responsiveness**:
    - The Merchant Dashboard uses fixed `p-8` padding which might be excessive on smaller screens.
    - The E2E "Activity Stream" on the home page might overflow on narrow mobile devices due to long Tx hashes.

---

## ✨ Design Polish (/polish)

1. **Brand Cohesion (Ivory Vault)**:
    - The Consumer App still uses `font-mono` heavily, while the Merchant components use `DM Sans`. We should unify on the **DM Sans / JetBrains Mono** pairing for a premium "Ivory Vault" feel.
    - The background `#F7F8FA` is used in some files but others default to standard white. We need a global `--ivory-vault` variable in `globals.css`.

2. **Micro-Animations**:
    - Add `layout` props to `framer-motion` cards so they slide smoothly when states change (e.g., from "Claiming..." to "Claimed").
    - Add a subtle "glow" effect to the `mUSDC` balance when it updates.

3. **UX Copy**:
    - Change "EXECUTE_PAYMENT" to "Checkout Now" or "Initialize BNPL" in the Consumer app to reduce "developer jargon" for regular users.
    - Add "Rent Reclaimed" tooltips to explain why certain IDs might change (internal transparency).

---

## 🛠️ Hardening (/harden)

1. **Error Boundaries**:
    - Add an `ErrorBoundary` around the `usePolaris` hook calls to prevent the entire UI from crashing if the Solana RPC or Phantom is disconnected.
2. **Transaction Persistence**:
    - If a user closes the tab after signing but before Convex confirms, the UI loses sync. Use `localStorage` to "resume" pending transaction confirmations.

---

## 🚀 Execution Plan
1. [ ] **Normalize Typography**: Force `DM Sans` as primary, `JetBrains Mono` as secondary.
2. [ ] **Glassmorphism pass**: Soften the card borders from `border/40` to `border/10` with a subtle `backdrop-blur`.
3. [ ] **Toast Unification**: Standardize all tx feedback using `sonner`.
