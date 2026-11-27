---
name: TSS Helpdesk
description: Internal desk where support executives resolve escalated merchant conversations, kept as a duplicate book.
colors:
  carbon: "#1d2b6b"
  carbon-deep: "#141f52"
  sheet: "#ffffff"
  office: "#fff4b8"
  office-edge: "#e6d68a"
  assistant: "#f9d7dd"
  assistant-edge: "#e8b4be"
  desk: "#f3f1ec"
  wash: "#f7f5f0"
  ink: "#20201e"
  line: "#dcd8cf"
  line-strong: "#c4bfb3"
  muted: "#66625a"
  faint: "#736f66"
  state-open: "#1c6b3c"
  state-progress: "#1d2b6b"
  state-waiting: "#8a5200"
  state-done: "#66625a"
  state-closed: "#736f66"
  urgent: "#b3261e"
  high: "#a64b0a"
  error-wash: "#fbeceb"
  error-ink: "#7a1a14"
typography:
  display:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "40px"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "26px"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  subject:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.375
  body:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.4
  caption:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
  number:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    fontFeature: '"tnum" 1'
rounded:
  chip: "4px"
  control: "5px"
  sheet: "6px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.carbon}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.carbon-deep}"
  button-note:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
  button-secondary-hover:
    backgroundColor: "{colors.wash}"
  button-quiet:
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    padding: "4px 8px"
  input:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  composer-note:
    backgroundColor: "{colors.office}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  sheet:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.sheet}"
  office-copy:
    backgroundColor: "{colors.office}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "12px 16px"
  assistant-copy:
    backgroundColor: "{colors.assistant}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "16px 20px"
  top-bar:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
    height: "56px"
  view-tab-active:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  error-note:
    backgroundColor: "{colors.error-wash}"
    textColor: "{colors.error-ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
---

# Design System: TSS Helpdesk

## Overview

**Creative North Star: "The Duplicate Book"**

The helpdesk is a carbon duplicate book on a warm desk. Every message is a copy on a specific paper, and the paper tells the agent who it is for before a word is read: white is the customer copy that goes to the merchant, yellow is the office copy that never leaves the pad, pink is the assistant's copy of what the AI gathered. Carbon blue is the ink everything is written in: the ticket numbers, the headings, the one filled action and the focus ring.

The density is that of a working pad, not a dashboard. Sheets are opaque white with hairline borders and a barely-there sheet shadow; queue rows are numbered stubs separated by dashed perforations; a near-black ink bar holds the navigation. Behind the sheets a ruled desk, drawn on a canvas, answers the pointer like carbon paper answers a pen. It shows only in the margins and never under text people read.

The world refuses the SaaS dashboard banner, the stat-card row and frosted glass. Hue outside the three papers belongs to ticket state, priority and errors, and those always arrive as an icon plus a word.

**Key Characteristics:**

- Three papers with fixed meanings: white customer copy, yellow office copy, pink assistant copy.
- Carbon blue (#1d2b6b) as the single writing ink for numbers, headings, primary action and focus.
- Warm greys mixed from ink; nothing drifts cool.
- Dashed perforations between stubs; ticket numbers lead as "No. 000014" in carbon with tabular figures.
- Public Sans throughout, extra-bold headlines with tight tracking.
- Interactive ruled-desk canvas behind opaque sheets, still under reduced motion.

## Colors

A warm paper desk written on in carbon blue, with three papers that carry meaning and a reserved set of state hues.

### Primary

- **Carbon Ink** (carbon): the writing ink. Pad numbers ("No." prefix at 75% opacity), page and ticket headlines, the primary button, the active count in a view tab, the caret, `accent-color`, and the 2px focus outline. Staff replies on the customer copy are set in carbon too, so the agent's own words read as written by hand on the white sheet.
- **Pressed Carbon** (carbon-deep): hover state of the primary action only.

### Secondary

- **Customer Copy White** (sheet): the paper that reaches the merchant. Every working sheet (queue pad, ticket sheet, side panels, login card), every field, and the composer in Reply mode.
- **Office Yellow** (office) with **Office Edge** (office-edge): the internal copy. Office notes in the thread, the composer in Note mode, the "Before you reply" handling note, the active nav underline and the waiting-count chip in the ink bar, and text selection. Office surfaces carry the faint 24px ruling.

### Tertiary

- **Assistant Pink** (assistant) with **Assistant Edge** (assistant-edge): the assistant's copy. The AI summary sheet on the ticket and the assistant's turns in the AI transcript.

### Neutral

- **Desk** (desk): the page ground behind all sheets.
- **Wash** (wash): table header strips, the ticket fact strip, row hover, secondary-button hover, and the merchant's own incoming messages.
- **Ink** (ink): body text and the top bar / login aside. Also the submit button when the composer is on the office copy.
- **Line** (line) and **Strong Line** (line-strong): inner dividers and sheet/field borders; the strong line also draws the perforation dashes and scrollbars.
- **Muted** (muted) and **Faint** (faint): secondary text, meta, icons in section titles, placeholders.

### State

- **Open** (state-open), **In progress** (state-progress, the carbon value), **Waiting on customer** (state-waiting), **Resolved** (state-done, the muted value), **Closed** (state-closed, the faint value).
- **Urgent** (urgent) and **High** (high) priority; urgent also tints the urgent view count and the error border.
- **Error Wash** (error-wash) and **Error Ink** (error-ink): the inline error note only.

### Named Rules

**The Paper Means Something Rule.** White is the customer copy, yellow the office copy, pink the assistant's copy. Never use a paper colour as decoration; a yellow surface must be internal and a pink surface must be the assistant's.

**The Reserved Hue Rule.** Hue outside the three papers and carbon is reserved for ticket state, priority and errors, and it is always shown as icon plus word, never as a filled pill or a colour alone.

**The One Ink Rule.** Carbon is the only writing ink. Numbers, headings, the primary action and focus are carbon; nothing else claims it.

## Typography

**Display Font:** Public Sans (with ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif)
**Body Font:** Public Sans
**Label/Mono Font:** Public Sans with tabular figures where numbers align

**Character:** One sturdy civic grotesque doing everything, the way a printed form uses one face. Weight carries the hierarchy: extra-bold carbon headlines, semibold subjects, bold small labels.

### Hierarchy

- **Display** (800, 40px, 1.08, -0.025em): the login aside headline on the ink panel only.
- **Headline** (800, 26px, tight, -0.02em, carbon): page titles (Queue, Common problems, Sign in); the ticket subject uses the same voice at 24px.
- **Title** (600, 15px, snug): stub subjects in the queue; the assistant summary body reads at 15px / 1.6 capped at 72ch.
- **Body** (400, 14px): fields, buttons, thread messages (14 to 14.5px, line height 1.55 to 24px on ruled paper).
- **Label** (700, 13px): section titles with a muted 16px icon, state and priority words (600), meta at 12 to 13px.
- **Number** (700, carbon, tabular): "No. 000014" pad numbers, counts and clocks.

### Named Rules

**The Opt-In Figures Rule.** Tabular figures are off globally and switched on with the `tnum` utility wherever numbers stack or tick: pad numbers, counts, clocks, codes.

## Layout

Content sits in a centred column up to 90rem with 16px side gutters (24px from 640px). Below the 56px sticky ink bar, the main area starts 28px down. Queue and ticket are two-column from 1280px: a fluid main column beside a fixed side column (20rem on the queue, 22rem on the ticket), with 32px between them; below that the side column stacks. The queue stub is a single grid row from 1024px (number and time, subject, state, priority, assignee, chevron) and collapses to number plus subject with meta beneath on narrow screens. Login splits into an ink aside and a form column from 1024px. Spacing runs on a 4px base, with sheets padded 16 to 24px and stubs 20px by 14px.

## Elevation & Depth

Mostly flat paper. Depth comes from paper stacking on the desk: opaque white sheets with a hairline border and an almost invisible sheet shadow. A stronger lift shadow is reserved for things picked up off the pad: the login card and a keyboard-focused stub. The canvas desk sits at z-0 behind everything; sheets sit at z-10.

### Shadow Vocabulary

- **Sheet** (`0 1px 0 rgb(32 32 30 / 0.04), 0 1px 3px rgb(32 32 30 / 0.05)`): every resting sheet and staff reply.
- **Lift** (`0 6px 16px -6px rgb(32 32 30 / 0.18), 0 1px 2px rgb(32 32 30 / 0.06)`): login card, focused stub.
- **Pressed ink** (`inset 0 1px 0 rgb(255 255 255 / 0.12), 0 1px 2px rgb(20 31 82 / 0.3)`): the primary button only.

### Named Rules

**The Opaque Sheet Rule.** Sheets are opaque. The ruled desk shows only in the margins; it is never seen through a sheet and never runs under text people read.

## Shapes

Small, near-square corners like cut paper: 4px for chips, thumbnails and filter toggles, 5px for buttons, fields and view tabs, 6px for sheets and message copies; full rounds only for avatars. Borders are 1px hairlines. The tear line between stubs is a dashed perforation (8px period, 1px tall, strong line), and the same dash flanks the "Assistant handed over" divider in the AI transcript. Office paper carries a 24px horizontal ruling. View tabs are folder tabs: rounded top corners whose active tab merges into the sheet below.

### Named Rules

**The Perforation Rule.** Stubs on the pad are separated by dashed perforations, never by solid rules or gaps; the last stub has none.

## Components

### Buttons

- **Shape:** gently squared (5px).
- **Primary:** carbon fill, white semibold 14px, 8px by 16px, pressed-ink shadow; hover to pressed carbon, nudges down 1px when active. One filled action per screen.
- **Note submit:** when the composer is on the office copy, the submit turns ink instead of carbon.
- **Secondary:** white with strong-line border, ink text, 6px by 12px; hover to wash.
- **Quiet:** muted text, no border; hover tints ink at 5% and darkens the text.
- **Focus:** 2px carbon outline, 2px offset, across all controls.

### Chips (state and priority)

- **Style:** flat, no fill and no border: a 16px icon plus the word in the state hue at 13px semibold (normal and low priority drop to medium weight).
- **Filter toggles** in common problems are 4px-cornered bordered chips.

### Cards / Containers (sheets)

- **Corner Style:** 6px.
- **Background:** white; wash strips for headers and fact rows.
- **Shadow Strategy:** sheet shadow at rest (see Elevation).
- **Border:** strong line.
- **Internal Padding:** 16 to 24px.

### Inputs / Fields

- **Style:** white, strong-line border, 5px, 8px by 12px, faint placeholder; selects draw their own muted chevron.
- **Focus:** border turns carbon with a 2px carbon ring at 15%.
- **Disabled:** 60% opacity, not-allowed cursor.

### Navigation

- **Top bar:** ink, 56px, sticky. Wordmark (pad logo, "TSS" bold with "Helpdesk" at 65% white), nav links white at 60% rising to full; the active link gets a 3px office-yellow underline. The waiting count is a yellow chip with ink tabular number and yellow text "waiting for a person".
- **View tabs:** folder tabs over the queue sheet with live tabular counts (carbon when active, urgent when the urgent view is non-zero, faint otherwise).

### Queue Stub (signature)

A numbered stub on the pad: carbon "No. 000014" with the time beneath in faint tabular figures, subject at 15px semibold, store and requester in muted meta, state and priority as icon-plus-word, a chevron. Hover washes the stub; keyboard focus lifts it off the pad with the lift shadow and an inset outline. Perforation below.

### Copies (signature)

Thread messages are copies on paper: the merchant's messages on wash with a line border, staff replies on the white customer copy in carbon with the sheet shadow, office notes on ruled yellow with a lock and "Office note, not sent". The assistant summary is a pink sheet.

### Composer (signature)

Reply and Note tabs flip the composer's paper: white customer copy in Reply, ruled office yellow in Note (focus there uses ink rather than carbon). The Note tab itself turns yellow when active; the Reply tab takes a 6% carbon tint.

### Ruled Desk Background (signature)

A fixed full-viewport canvas of carbon rulings every 28px at 7% opacity. Near the pointer the lines bow toward it and darken (up to +30%); moving leaves a carbon trace that fades over 1.4s; a click presses a ring that expands over 700ms. It animates only while something is changing, pauses when the tab is hidden, ignores touch, and under reduced motion is a still ruling.

## Do's and Don'ts

### Do:

- **Do** put internal content on office yellow with its ruling and a lock plus "not sent" wording, and assistant content on assistant pink.
- **Do** lead every ticket reference with the carbon pad number ("No." then the digits) in tabular figures.
- **Do** show state and priority as a 16px icon plus the word in its hue.
- **Do** separate stubs with the dashed perforation and keep sheets opaque over the ruled desk.
- **Do** keep one carbon-filled primary action per screen and use the 2px carbon focus outline everywhere.
- **Do** keep the background still under reduced motion and out from under reading text.

### Don't:

- **Don't** use yellow or pink for anything that is not the office copy or the assistant's copy.
- **Don't** introduce hue outside the papers, carbon and the state, priority and error set, and don't show state as colour alone or as a filled pill.
- **Don't** add a dashboard banner, a stat-card row or frosted glass.
- **Don't** let greys drift cool; mix them from ink.
- **Don't** round sheets beyond 6px or controls beyond 5px.
