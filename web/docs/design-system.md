# PresentsAI Design System

A single source of truth for colors, typography, spacing, and UI primitives.
The goal is one consistent look across every screen — dashboard, editor, auth,
and the side panels. **Never hardcode hex colors or raw Tailwind palette
classes (`gray-*`, `blue-*`, `purple-*`, …) in feature code.** Use the tokens
and primitives below.

---

## 1. Design Tokens

Tokens live in two places that must stay in sync:

- **`web/tailwind.config.ts`** — the canonical token values (colors, shadows, radii).
- **`web/src/app/globals.css`** — the `@layer components` recipes (`.btn`, `.input`, `.card`, …) built from those tokens.

### Color

Reference tokens by their semantic name, not by a palette number.

| Token | Use for |
|---|---|
| `primary-50 … primary-900` | Brand (indigo). Buttons, active states, focus. `primary-600` is the default action color. |
| `surface` / `surface-subtle` / `surface-muted` | Page/card backgrounds. `surface` = white, `surface-subtle` = app background, `surface-muted` = hover/inset fills. |
| `border` / `border-strong` / `border-focus` | Dividers and outlines. Default to `border-border`. |
| `content-primary` | Primary text (`#0F172A`). |
| `content-secondary` | Secondary/label text. |
| `content-tertiary` | Muted text, placeholders, timestamps. |
| `content-disabled` / `content-inverse` / `content-link` | Disabled / on-dark / link text. |
| `success` / `warning` / `error` / `info` | Status. Each has `.light` (bg) and `.dark` (text) variants. |

Do:  `text-content-secondary`, `bg-surface-subtle`, `border-border`, `bg-primary-600`
Don't: `text-gray-600`, `bg-slate-50`, `border-gray-200`, `bg-blue-600`

> **Exception:** the presenter/viewer screens (`/present`, `/view`) and the
> slide-canvas color pickers intentionally use a dark theme / literal hex
> values — those are *content* colors, not UI chrome, and are out of scope for
> tokenization.

### Typography

- Font: **Inter** (`font-sans`), loaded in `globals.css`.
- Scale (Tailwind defaults): `text-xs` (12) · `text-sm` (14, default body) · `text-base` (16) · `text-lg` (18) · `text-xl` (20) · `text-2xl` (24) · `text-4xl` (36, hero).
- Weights: `font-medium` (labels/buttons), `font-semibold` (panel titles), `font-bold` (headings).

### Spacing & Radius

- Spacing: Tailwind 4px scale (`gap-2`, `p-3`, `px-6`, …). Panels use `p-3`; modals use `p-6`.
- Radius: `rounded-lg` (controls), `rounded-xl` (cards/list rows), `rounded-2xl` (modals), `rounded-full` (pills/avatars).

### Elevation

| Shadow | Use |
|---|---|
| `shadow-card` | Resting cards. |
| `shadow-card-hover` | Hovered interactive cards. |
| `shadow-modal` | Modals, popovers, dropdowns. |

### z-index

`z-10` sticky headers / outside-click catchers · `z-20` dropdown menus · `z-50` modal backdrops · `1000` portal popovers.

---

## 2. Component recipe classes (`globals.css`)

Plain HTML elements can opt into the system with these classes:

| Class | Element |
|---|---|
| `.btn` + `.btn-{sm,md,lg}` + `.btn-{primary,secondary,ghost,danger}` | `<button>` |
| `.input` | `<input>` |
| `.textarea` | `<textarea>` |
| `.select` | `<select>` |
| `.card` | container |
| `.badge` | status pill |
| `.modal-backdrop` / `.modal-panel` | dialog scaffolding |
| `.side-panel` / `.side-panel-header` / `.side-panel-title` | editor docked panels |

Prefer the React primitives below — they wrap these classes and add a11y/state handling.

---

## 3. UI Primitives (`web/src/shared/components/ui`)

Import from the barrel: `import { Button, Modal, Select } from "@shared/components/ui";`

| Primitive | Key props | Notes |
|---|---|---|
| `Button` | `variant` (primary/secondary/ghost/danger), `size` (sm/md/lg), `loading` | Includes spinner + disabled handling. |
| `Input` | `label`, `error`, `hint` | Labelled field with error/hint slots. |
| `Textarea` | native + `.textarea` | Multiline input. |
| `Select` | native `<select>` + `.select` | Styled dropdown. |
| `Card` | `interactive` | Surface container; `interactive` adds hover elevation. |
| `Modal` | `open`, `onClose`, `title`, `subtitle`, `size` | Backdrop + Escape/click-out close. |
| `Badge` | `variant` (default/primary/success/warning/error/info) | Status pill. |
| `RoleBadge` | `role` (owner/editor/viewer) | Canonical collaborator role pill (shared by ShareModal + MembersPanel). |
| `Avatar` | `name`, `size` | Deterministic color-from-name initials. |
| `Popover` | `trigger`, `align` | Portal-positioned floating panel. |

### Usage example

```tsx
import { Button, Modal, Input, Select, RoleBadge } from "@shared/components/ui";

<Modal open={open} onClose={close} title="共有設定" subtitle={title}>
  <div className="p-6 space-y-4">
    <Input label="メールアドレス" type="email" />
    <Select value={role} onChange={…}>
      <option value="viewer">閲覧者</option>
    </Select>
    <RoleBadge role="owner" />
    <Button variant="primary">招待</Button>
  </div>
</Modal>
```

---

## 4. Do / Don't

| Do | Don't |
|---|---|
| `<Button variant="primary">` | `<button className="bg-blue-600 text-white …">` |
| `bg-surface-subtle` | `bg-gray-50` |
| `text-content-tertiary` | `text-gray-400` |
| `<RoleBadge role={r} />` | redefining a local `ROLE_BADGE` color map |
| `.side-panel` on editor asides | `flex flex-col border-l bg-white` |
| `<Modal>` | hand-rolled `fixed inset-0 bg-black/40 …` |

---

## 5. Coverage status

Migrated to the system in the `feature/design-system` work:

- ✅ Dashboard, Login (already on-system; verified)
- ✅ Editor header & docked aside panels (`editor/[id]/page.tsx`)
- ✅ ShareModal, ShareButton
- ✅ MembersPanel, CommentsPanel, VersionHistoryPanel

Not yet migrated (tracked as follow-up — still functional, just off-token):

- ⬜ `ProofreadPanel`, `PropertyPanel/*`, `Toolbar/*`, `Ribbon/*` (large editor surfaces)
- ⬜ `/present` and `/view` (intentional dark theme — needs a dark-token decision first)
