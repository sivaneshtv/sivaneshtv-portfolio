# 04 · Content — The Source of Truth

**Purpose:** Every piece of copy on the site, organised by page and section. Claude Code copies from here. When anything ambiguous comes up, **this doc wins over the prototype HTML**.

**How to read this:** Each section provides the copy as it should appear, with formatting conventions marked. `<em>…</em>` wraps words that render as red italic (the signature style). Single quotes mean literal punctuation. Commented blocks note artifacts that go alongside the prose.

**Revision policy flagged inline:**
- 🔒 **Locked** — Sivanesh has approved this exact phrasing. Don't change wording unless explicitly asked.
- 🟡 **Draft** — approved direction but open to refinement.
- 🟠 **Placeholder** — obvious placeholder; Sivanesh needs to supply the real content.

---

# Site-wide

## Meta

🔒 **Site title:** `Sivanesh TV — Product Designer`
🔒 **Site tagline (OG description):** `Product design for critical operations — drone autonomy, fleet tools, infrastructure-management systems. Based in Pune, open to briefs.`
🔒 **Favicon:** TBD (suggest: a red-ink S initial on cream, matching the photo frame)
🟠 **OG image:** placeholder — generate one with site title + name on cream paper

## Topbar (global)

- **Left**: logo button labeled `Sivanesh.tv — the workbench` (on homepage) or `Sivanesh.tv — <Case Name>` (on case pages) with a small menu-icon and dropdown-chevron
- **Right**: `Taking briefs · <clock IST> · Pune, IN` — the clock ticks live

## Footer credit (bottom of canvas, small marker text)

🔒 `© 2026 Sivanesh TV · hand-built · last updated apr 2026`

## Help overlay (first-visit)

🔒 **Title:** `This is a whiteboard.`
🔒 **Body:** `Scroll to pan around. Click any sketch, sticky, or polaroid to open the full work.`
🔒 **Keys line:** `scroll pan · ⌘ + scroll zoom · space + drag pan fast · F fit`
🔒 **Dismiss button:** `got it`

## Mobile hint (first touch)

🔒 `pinch to zoom · drag to pan`

---

# Page 1 · The Workbench (/)

## Zone labels (faded backdrop text)

🔒 These sit at 12% opacity as decorative backdrops:

- Hello zone: `— hello —`
- Work zone: `the <em>work</em>`
- How-I-work zone: `how <em>I</em> work`
- Say-hi zone: `say <em>hi</em>`

The About zone uses a title heading in the same style (see below) rather than a separate zone-label.

## Hello zone

### Masthead

🔒 **Eyebrow:** `hey, I'm —`
🔒 **Title:** `Sivanesh <em>TV</em>,<br>a designer<br>who <span class="strike">talks</span> <em>ships.</em>`

> Formatting note: `talks` is struck through with a hand-drawn red line. `TV` and `ships.` render as red italic. The title is three lines — do not collapse.

🔒 **Sub-headline:** `Product design for <em>critical operations</em> — drone autonomy, fleet tools, interfaces where a wrong tap costs more than time. Based in Pune · open to briefs.`

> Formatting note: `critical operations` renders as red with yellow-highlight background.

### Profile photo frame

🔒 **Caption:** `— that's me, Pune IN —`
🟠 **Placeholder**: letter "S" in a gradient — replace with real photo when available

## About zone

### About heading (zone-label style backdrop)

🔒 `about <em>me</em>`

### Sticky 1 — who I am (pink, ~x=800, y=1810)

🔒 **Eyebrow:** `— in my own words —`
🔒 **Body:** `A product designer who cares about <em>structure</em> more than surface. Happiest when the problem is fuzzy, the stakes are real, and the answer is a rule — not a mood board.`

### Sticky 2 — belief (yellow, ~x=1280, y=1870)

🔒 **Eyebrow:** `— what I hold to —`
🔒 **Body:** `Structure <em>before</em> style. Always. Style is how structure <em>shows itself.</em>`

### Sticky 3 — basketball (orange, ~x=800, y=2150)

🔒 **Eyebrow:** `— off the bench —`
🔒 **Body:** `Shooting forward / small forward. State-level in college, <em>Tamil Nadu.</em> Still play every week.`
🔒 **Icon:** inline SVG basketball (orange `#d65f0f` fill, brown `#2a1400` lines)
🔒 **Background:** `#f28c3f` (orange)
🔒 **Eyebrow color:** `#4a2a00` (brown, for contrast with orange)
🔒 **Body color:** `#2a1400`, em `#7a1a00`

### Sticky 4 — manhwa (cream, ~x=1280, y=2210)

🔒 **Eyebrow:** `— late nights —` (eyebrow color purple `#6a2a8a`)
🔒 **Body:** `Solo Leveling, Omniscient Reader, Tower of God. Nights belong to <em>manhwa.</em>` (em color purple `#6a2a8a`)
🔒 **Icon:** inline SVG of two overlapping comic panels
🔒 **Background:** `#f5ede0` (warm cream)

### Sticky 5 — music (green, ~x=1030, y=2440)

🔒 **Eyebrow:** `— always on —`
🔒 **Body:** `Can't get through a day without good music. Obsessed.`

## Work zone

### Polaroid 1 — Cockpit View 2.0

🔒 **Link:** `/cockpit`
🔒 **Caption:** `Cockpit View <em>2.0</em>`
🔒 **Meta:** `2024 · Drone Autonomy`
🟡 **Image:** Currently an SVG sketch of a radar HUD — replace with actual Cockpit screenshot when available

### Polaroid 2 — Fleet View

🔒 **Link:** `/fleet`
🔒 **Caption:** `Fleet <em>View</em>`
🔒 **Meta:** `2024–25 · Fleet Operations`
🟡 **Image:** SVG sketch of grid of drones with alerts — replace with screenshot

### Polaroid 3 — Asset Management

🔒 **Link:** `/asset`
🔒 **Caption:** `Asset <em>Management</em>`
🔒 **Meta:** `2025 · Infrastructure-first module`
🟡 **Image:** SVG sketch of nav rail + map + asset pins — replace with screenshot

### Work note sticky (green, ~x=4450, y=1710)

🔒 **Eyebrow:** `— 3 cases · many more shipped —`
🔒 **Body:** `These three are <em>written up.</em> Plenty more lives inside <em>FlytBase's</em> enterprise product — happy to walk through.`

### Click-hint marker (~x=3680, y=1620)

🔒 `click any to open ↓` (marker-red, -4° rotation)

## How-I-work zone

### Zone-label heading backdrop (~x=1300, y=3050)

🔒 `how <em>I</em> work`

### Index card — "how I actually work" (~x=1200, y=3180)

🔒 **Title:** `how <em>I</em> actually work`
🔒 **Sub:** `— typical week —`
🔒 **Rows:**
| Label | Value |
|---|---|
| Sit close to CS + PM | calls, transcripts |
| Turn findings into structure | IA, flows, rules |
| Prototype in the real tool | Figma → Lovable → code |
| Pair with engineering | daily, ship weeks |
| Deep work | `<em>10:00 – 14:00 IST</em>` |
| Collab hours | `15:00 – 18:00 IST` |

### Todo list — "what I practice" (~x=1730, y=3200)

🔒 **Title:** `what I <em>practice</em>`
🔒 **Sub:** `— the verbs —`
🔒 **Rows (all checked):**
- Absorb
- Structure
- Prototype
- Systematise
- Ship
- Critique

### Sticky — tools (blue, ~x=2200, y=3230)

🔒 **Eyebrow:** `— tools, apr '26 —`
🔒 **Body:** `Figma · <em>Claude</em> · Lovable · Cursor · iA Writer · MacBook Pro M3.`

### Sticky — what I bring (pink, ~x=2520, y=3190)

🔒 **Eyebrow:** `— what I bring to a team —`
🔒 **Body (bulleted):**
- Structural thinking <em>before</em> pixel-pushing
- Comfort with <em>ambiguity</em> early-stage
- Clean handoffs — specs, rules, edge cases
- Pair fluency with engineers

### Marker — ties to the row (~x=2850, y=3460)

🔒 `↖ this is what<br>gets shipped`

## Say-hi zone

### Zone-label heading (~x=3800, y=3240)

🔒 `say <em>hi</em>`

### Contact card (~x=3900, y=3420)

🔒 **H3:** `if this <em>clicked</em> — say hi.`
🔒 **Body:** `Taking briefs in Q2 '26. Short contracts, design lead roles, advisory, pair-thinking sessions. Drop a line — I read everything.`
🔒 **Email:** `hello@sivanesh.tv` (or whichever address Sivanesh uses)
🔒 **Socials:** LinkedIn ↗ · Read.cv ↗ · Twitter ↗ (with the right URLs)

### Availability sticky (yellow, ~x=4480, y=3520)

🔒 **Eyebrow:** `— availability —`
🔒 **Body:** `Open to <em>Q2 '26</em> briefs. Pune-based, work across IST hours.`

### Arrow from zone label to card

🔒 Start top-left, curl down-right, ending at card top-left edge. No inline label text — the zone label above already says "say hi."

---

# Page 2 · Cockpit View 2.0 (/cockpit)

## Frontmatter (MDX)

```yaml
slug: cockpit
order: 1
title: Cockpit View 2.0
subtitle: Redesigning the primary control interface for autonomous drone operations — from the ground up.
year: 2024
role: Lead · with Prathamesh
scope: End-to-end UX · Design system
tools: Figma · Claude · Lovable
status: shipped
```

## Case topbar

🔒 **Case label:** `CASE STUDY · 01 · Cockpit View 2.0`
🔒 **Back link:** `← workbench`

## Hero section (before reader column)

🔒 **Eyebrow:** `— case study · 01 —`
🔒 **Title:** `Cockpit <em>View</em> 2.0`
🔒 **Subtitle:** `Redesigning the primary control interface for autonomous drone operations — from the ground up.`

### Meta row (below hero)

| Label | Value |
|---|---|
| Role | Lead · with Prathamesh |
| Year | 2024 |
| Scope | End-to-end UX · Design system |
| Tools | Figma · Claude · Lovable |

### Hero image slot

🟠 **Placeholder.** Caption: `Cockpit View 2.0 — in-flight, live telemetry` / `the interface`.
Ideally 2400 × 1500 px at 16:10. Shows the live UI — map, video feed, mission panel, system controls all visible.

## § 01 — Context

🔒 **Section label:** `Context <span class="num">§ 01</span>`
🔒 **H2:** `Cockpit View is the <em>primary interface</em> operators live in all day.`
🔒 **Lead:** `It runs entirely in a browser — no native app, no dedicated hardware — and it has to perform like both a map and a command centre simultaneously. When we inherited the design, it worked. But "working" and "trustworthy" aren't the same thing at this scale.`

🔒 **Body:**
> Professional drone operators use Cockpit View to control autonomous flights, monitor live video, manage missions, and respond to in-flight events. Every shift is hours long. Every alert matters. Every moment of ambiguity in the interface translates into cognitive load the operator can't afford.

> The v1 interface was built for a single drone. By the time I joined, operators were running multiple sites, responding to alerts from integrations fired at any hour, and beginning to prepare for regulatory one-to-many waivers. The interface hadn't caught up.

## § 02 — The problem

🔒 **Section label:** `The problem <span class="num">§ 02</span>`
🔒 **Pullquote:** `The interface was working. The <em>operators</em> were doing the work it should have been doing.`

🔒 **Body:**
> When we sat in on CS calls and read the transcripts, a pattern emerged. Operators were compensating — memorising which panel held which control, ignoring alerts they'd learned to filter out, opening multiple browser tabs to "see everything at once." The interface wasn't broken. It was offloading its work onto the person using it.

> The hard part wasn't identifying this. The hard part was <strong>deciding what to change first</strong> when the answer was <em>everything is coupled to everything</em>.

🔒 **Callout:** `Information architecture is the spine. Before we could fix any screen, we had to decide where everything should <em>live</em>, and why. That became the first of four structural rewrites.`

🔒 **Margin ref:** `↗ see the alert-system redesign`

🟠 **Image slot 02 — v1 interface annotated.** 16:9, 2200 × 1240 px. Screenshot of old Cockpit with red-pen annotations showing what operators compensated for.

## § 03 — Step one (IA)

🔒 **Section label:** `Step one <span class="num">§ 03</span>`
🔒 **H2:** `Before designing anything, decide where everything <em>lives</em> — and why.`
🔒 **Lead:** `The first structural decision wasn't visual. It was categorical.`

🔒 **Body:**
> We mapped every piece of information, every action, every state across the old interface — then sorted them into three buckets based on a simple test: does the operator need this to <em>monitor</em>, to <em>act</em>, or to <em>diagnose</em>? Everything got one bucket. No exceptions.

> That single rule eliminated the question of where to put things. Monitoring information (live video, telemetry, map state) became the always-visible surface. Action controls (mission dispatch, manual override, emergency stop) became the ever-ready toolbar. Diagnostic data (logs, history, settings) moved to on-demand panels. The operator now knew where to look without thinking — which is exactly what matters when there's no time to think.

🔒 **Margin ref:** `↗ see the IA diagram`

🟠 **Image slot 03 — IA diagram.** 16:9, 2000 × 1125 px. IA diagram showing Monitor / Act / Diagnose sort.

## § 04 — Step two (Alerts)

🔒 **Section label:** `Step two <span class="num">§ 04</span>`
🔒 **H2:** `If the alerts panel is empty, <em>that</em> should feel like good news.`
🔒 **Lead:** `v1 buried alerts. Low-priority warnings, critical emergencies, informational nudges — all stacked in the same list. Operators had learned to ignore them.`

🔒 **Body:**
> We rebuilt the alert system with three levels — <strong>critical, warning, informational</strong> — each with a distinct visual grammar, a distinct sound, and a distinct action model. Critical alerts take over the interface until acknowledged. Warnings persist until resolved. Informational alerts fade after a beat.

> More importantly: the alert panel now tells you when it's empty. A quiet green state, explicit and visible. An empty panel should feel like a <em>status</em>, not an absence.

🔒 **Callout:** `"If there's nothing to worry about, say so. Don't leave the operator wondering whether the alert system is broken."`

🔒 **Margin ref:** `↗ see the alert severity diagram`

🟠 **Image slot 04 — alert severities.** 16:9, 2000 × 1125 px. Three states plus empty-green state.

## § 05 — Step three (Feedback)

🔒 **Section label:** `Step three <span class="num">§ 05</span>`
🔒 **H2:** `One question per system. <em>Three questions</em> total.`
🔒 **Lead:** `Every piece of feedback in the interface — every status indicator, every confirmation, every animation — now answers one of three questions, and only one.`

🔒 **Body:**
> <strong>Is the connection healthy?</strong> Answered by the always-visible network glyph at the top-right. Red if the drone has lost link. Amber if degraded. Green if nominal.

> <strong>Is the command understood?</strong> Answered by a micro-interaction at the action point. The button dims. A dot pulses. A confirmation appears <em>at the location of the action</em>, not somewhere else on screen.

> <strong>Is the drone doing what I asked?</strong> Answered by the map and telemetry together, updating in sync. If they ever disagree, we show the disagreement explicitly rather than picking a winner.

🟠 **Image slot 05 — feedback micro-interactions.** 4:3, 1600 × 1200 px. Close-ups of the three indicators.

## § 06 — Step four (Layout)

🔒 **Section label:** `Step four <span class="num">§ 06</span>`
🔒 **H2:** `A layout that earns operator trust by <em>never</em> surprising them.`
🔒 **Lead:** `The biggest complaint with v1 wasn't what things did — it was that things <em>moved</em>. Panels re-sized depending on what was active. Controls appeared and disappeared. The operator never developed muscle memory.`

🔒 **Body:**
> v2 uses a fixed layout grammar. Four zones: map (left), video feed (right), mission panel (bottom-left), system controls (bottom-right). Nothing ever moves. Zones can expand or collapse for emphasis, but their positions are permanent. The operator's hand knows where to go before their eyes confirm it.

> This sounds boring. It is boring. Boring is the entire point.

🟠 **Image slot 06 — fixed zones.** 16:9. Annotated screenshot showing the four permanent zones.

## § 07 — Outcome

🔒 **Section label:** `Outcome <span class="num">§ 07</span>`
🔒 **H2:** `What shipped — and what it changed.`

🔒 **Body:**
> Cockpit View 2.0 shipped to FlytBase's enterprise customers in Q4 2024. It's now the default interface across all deployments. In the quarters after, enterprise customer calls about "which panel do I use for…" dropped by an order of magnitude. The interface that works — really works — is the one the operator stops needing to think about.

### Outcome grid (3 columns)

| Number | Label | Description |
|---|---|---|
| 42% | lower error rate | Operator-reported alert acknowledgement errors dropped significantly after the severity grammar rewrite. |
| 4 | permanent zones | Map / video / mission / system. Nothing moves. Muscle memory for the operator. |
| v2 | enterprise default | Shipped Q4 2024. Now the default UI across all customer deployments. |

## § 08 — Reflection

🔒 **Section label:** `Reflection <span class="num">§ 08</span>`
🔒 **H2:** `What I learned building Cockpit.`

🔒 **Body:**
> The hardest part wasn't any one design decision. It was resisting the temptation to re-skin when the actual problem was structural. Every shortcut — "can we just tweak the panel widths?" "can we just add a new alert type?" — would have kicked the can a quarter forward and undone the next year of work.

> Structure before style. I knew the phrase before I started this project. I understand it now.

## Artifacts on the canvas

The case study canvas has ~15 pinned artifacts anchored to sections:

### Wayfinding markers (hero anchor)
- **Red marker, left side:** `↓ read straight through` (rotation -8°)
- **Black marker, right side:** `drag around to<br>explore →` (rotation 4°)

### § 02 artifacts
- 🔒 **Pink sticky** — operator observation quote. Eyebrow: `— operator, multi-monitor setup —`. Body: `"I have Cockpit in one tab, alerts in another, video feed pinned separately. <em>That's my workflow.</em>"`

### § 03 artifacts (the IA decision — signature principle)
- 🔒 **Principle card.** Label: `the interaction rule every tool obeys`. Title: `<em>Push</em> or <em>Overlay.</em> Every tool picks one.`. Body: `Tools that need ambient awareness push the body to make room (flight plan, pilot list). Tools that need focused attention overlay with scrim and dismiss on outside click (checklist, alert detail).`. Attribution: `— the IA of a complex cockpit`
- 🔒 **Diagram** — IA sort (Monitor / Act / Diagnose). Title: `The three-bucket sort`. Sub: `INFORMATION ARCHITECTURE · THE SORT`.

### § 04 artifacts (alerts)
- 🔒 **Diagram** — alert grammar chart. Title: `Four severities. Four visual grammars.`. Sub: `ALERT SYSTEM · HIERARCHY`. The four levels: Airspace / Diagnostics / Weather / System, each with a distinct color + icon.
- 🔒 **Green sticky** — receipt. Eyebrow: `— the signature —`. Body: `An empty panel is a <em>status</em>, not absence. Green, explicit, visible.`

### § 05 artifacts (feedback)
- 🔒 **Diagram** — three indicator states. Title: `Three questions. Three answers.`.

### § 06 artifacts (layout)
- 🔒 **Yellow sticky** — the rule. Eyebrow: `— the grammar —`. Body: `Four zones. Nothing moves. <em>Boring is the point.</em>`

### § 07 artifacts (outcome)
- 🔒 **Green sticky** — shipped receipt. Eyebrow: `— v2 shipped —`. Body: `Q4 2024. Now the default interface across all FlytBase enterprise deployments.`

### § 08 artifacts (reflection)
- 🔒 **Blue sticky** — reflection. Eyebrow: `— what I learned —`. Body: `The temptation was always to re-skin. The real work was always structural.`

---

# Page 3 · Fleet View (/fleet)

## Frontmatter

```yaml
slug: fleet
order: 2
title: Fleet View
subtitle: A command environment for pilots and supervisors running multiple drones at once — built for the regulatory future.
year: 2024–25
role: Co-designer · with Arpita
scope: System architecture · Interaction design
tools: Figma · Claude
status: shipped
```

## Case topbar

🔒 **Case label:** `CASE STUDY · 02 · Fleet View`

## Hero

🔒 **Eyebrow:** `— case study · 02 —`
🔒 **Title:** `Fleet <em>View</em>`
🔒 **Subtitle:** `A command environment for pilots and supervisors running multiple drones at once — built for the regulatory future.`

### Meta row

| Label | Value |
|---|---|
| Role | Co-designer · with Arpita |
| Year | 2024–25 |
| Scope | System architecture · Interaction design |
| Tools | Figma · Claude |

🟠 **Hero image slot.** 16:10, 2400 × 1500 px. Shows the live Fleet dashboard — drone list left, large map/video wall center, command panel right.

## § 01 — The project

🔒 **Section label:** `The project <span class="num">§ 01</span>`
🔒 **H2:** `Fleet View is the <em>command environment</em> for operators running many drones at once.`
🔒 **Lead:** `The business problem was simple: more drones, same number of pilots. The design problem was harder — <em>how do you keep one person genuinely safe across ten simultaneous flights?</em>`

🔒 **Body:**
> Fleet View sits at the centre of FlytBase's enterprise operations stack. It's used by certified pilots monitoring active missions and by operations supervisors coordinating across sites. In a regulatory environment where one-to-many drone operation is rapidly becoming the norm, Fleet View is what makes that legal — and what makes it safe.

> The design brief began with a quote pulled from a CAA waiver application: *"The pilot must maintain situational awareness of all airframes under their supervision at all times."* Translate that into a design constraint: whatever's happening across the fleet has to be legible, fast, on one screen.

🟠 **Image slot 02 — CAA quote context.** Caption: `the regulatory constraint, in the operator's words`.

## § 02 — The challenge

🔒 **Section label:** `The challenge <span class="num">§ 02</span>`
🔒 **Pullquote:** `Two different people. Completely different needs. One interface that couldn't afford to <em>fail either of them.</em>`

🔒 **Body:**
> The tricky part: two user personas, one screen. The <strong>pilot</strong> is acting — dispatching missions, handling exceptions, maintaining the safety case. The <strong>supervisor</strong> is watching — reviewing metrics, spotting patterns, coordinating across customers and sites. If we designed for one, we lost the other. If we designed a toggle, neither felt right.

> The answer was a layered architecture where both personas get the same surface, but the density and depth of each component adapt to context.

## § 03 — The central decision

🔒 **Section label:** `The central decision <span class="num">§ 03</span>`
🔒 **H2:** `Group, don't <em>filter.</em>`
🔒 **Lead:** `Standard data tables let you filter rows out. In a drone fleet dashboard, that's the wrong instinct.`

🔒 **Body:**
> A pilot doesn't want to hide drones. A pilot wants to <strong>see all the drones, grouped by what they're doing</strong>. Flying, idle, charging, offline. Armed, disarmed. Alert-state, nominal. The instinct that a filter will help is a leftover from admin dashboards; it doesn't survive contact with actual operations.

> We built grouping as the primary navigation primitive. The drone list is always a grouped list. Filters exist as a secondary refinement (hide test drones, show only customer X), never as a way to "focus." Every drone the pilot is responsible for is always on screen.

🔒 **Callout:** `"Grouping, not filtering" — straight from the PRD, straight to the operators. The rule every table decision obeyed.`

## § 04 — Layer 0 components

🔒 **Section label:** `Layer 0 <span class="num">§ 04</span>`
🔒 **H2:** `Four components, each with a job, each at the same layer.`
🔒 **Lead:** `We called them Layer 0 — the base surface. They're always there. Everything else layers over them.`

🔒 **Body:**
> The four components:
> 1. **Drone List** (left sidebar). The grouped source of truth for every drone under supervision. Expandable, scannable, clickable.
> 2. **Map 3D** (center). A three-dimensional map rendering every drone's position, path, and state. Also the primary target for group-level actions.
> 3. **Live Stream Wall** (center-right or toggled). The video feed grid. Pilots routinely have 4–6 feeds up during active operations.
> 4. **App Drawer** (right). The command surface. Per-drone commands when a drone is selected; fleet-level commands when a group is selected.

> These four never overlap. They never hide each other. The App Drawer slides in; the Stream Wall toggles; the Drone List collapses to icons on smaller screens. But at any moment, all four are accessible within one gesture.

🟠 **Image slot — Layer 0 diagram.** A clean annotated diagram of the four zones.

## § 05 — Spotlight mode

🔒 **Section label:** `Spotlight <span class="num">§ 05</span>`
🔒 **H2:** `When one drone matters most, the interface <em>agrees.</em>`
🔒 **Lead:** `Any drone can be 'spotlighted' — pulled to centre stage with its feed, its telemetry, and its command set foregrounded. Everything else dims but stays accessible.`

🔒 **Body:**
> Spotlight is not a fullscreen mode. It's not a drawer. It's a dimming-and-emphasis state that says: "this one matters most right now, but the rest are still here." The pilot can spotlight a drone during an exception, focus for 30 seconds, then release and return to the grouped view.

> Critically: spotlight never hides anything. The alerts panel is still visible. The other drones' states are still monitorable in the Drone List. The operator never loses the fleet-level picture — they just temporarily elevate one drone's picture to co-equal.

## § 06 — Fleet commands

🔒 **Section label:** `Fleet commands <span class="num">§ 06</span>`
🔒 **H2:** `Five commands. <em>Destructive first.</em>`
🔒 **Lead:** `When things are already going wrong, the commands a pilot needs most are the most destructive ones. We ordered the command menu accordingly.`

🔒 **Body:**
> The five fleet-level commands, ordered by how-likely-you-are-to-need-this-in-an-emergency:
> 1. **STOP** — halt mission. All drones in the group cease active flight, hover-and-hold.
> 2. **RTDS** — Return To Dock / Safe. All drones navigate home.
> 3. **GTSA** — Go To Safe Altitude. Drones climb to a pre-configured safe altitude and hold.
> 4. **RTSL** — Return To Starting Location. Drones fly back to their launch point.
> 5. **FTS** / **Parachute** — Flight Termination. Cut power, deploy parachute. Last resort.

> Every command has a required-confirmation step with a typed short-code. No one has ever accidentally cut a drone's power from the Fleet View command panel.

## § 07 — State hierarchy

🔒 **Section label:** `State hierarchy <span class="num">§ 07</span>`
🔒 **H2:** `Armed > Disarmed > Offline. Every drone, every time.`

🔒 **Body:**
> Every drone is in one of these three super-states, visible at every scale — in the list, on the map, in the spotlight view, in the history log. State is not a filter. State is a <em>fact about the drone</em> that the interface surfaces consistently.

> Armed drones can receive commands and take flight. Disarmed drones are on the ground and can be re-armed. Offline drones have lost link — they might be flying autonomously, they might be down, the dashboard doesn't know. The operator always knows which bucket they're in.

## § 08 — Outcome

🔒 **Section label:** `Outcome <span class="num">§ 08</span>`
🔒 **H2:** `Live in enterprise. Powering CAA waiver programs.`

🔒 **Body:**
> Fleet View shipped in phases through 2025. It's now in active use with enterprise customers running one-to-many operations under CAA waivers. The layered architecture has held up — we've added new components (custom metrics, the advanced waiver reporting module) without rewriting the four Layer 0 components. The rule held.

### Outcome grid

| Number | Label | Description |
|---|---|---|
| 4 | Layer 0 components | Drone List, Map 3D, Stream Wall, App Drawer — always present, never hiding each other. |
| 5 | fleet commands | STOP, RTDS, GTSA, RTSL, FTS. Destructive first. |
| 1:N | operation enabled | Supports one-pilot-many-drones workflows under CAA waivers. Live with enterprise. |

## Artifacts on the canvas

- 🔒 **Principle card** (§03). Label: `the table rule`. Title: `<em>Group, don't filter.</em>`. Body: `A pilot doesn't want to hide drones. A pilot wants to see everything they're responsible for — grouped.`. Attribution: `— straight from the Fleet PRD`
- 🔒 **Context card** (§01). Label: `— the regulatory pull —`. Title: `"The pilot must maintain situational awareness of <em>all airframes</em> under their supervision at all times."`. Body: `— CAA waiver applications, paraphrased across multiple programs.`
- 🔒 **Pink sticky** — 4K-monitor quote. Eyebrow: `— pilot, beta program —`. Body: `"I got a 4K monitor just so I could see all the feeds at once. The 1080p was making me scroll."`
- 🔒 **Diagram** — Layer 0 map. Shows the four components as a grid.
- 🔒 **Diagram** — fleet commands ordered by destructiveness. Red gradient.
- 🔒 **Green sticky** — receipt. Eyebrow: `— 1:N live —`. Body: `Fleet View powers one-to-many waiver programs at enterprise customers.`
- 🔒 **Blue sticky** — reflection. Eyebrow: `— what we kept —`. Body: `The rule held: new components layered onto Layer 0. <em>We never had to rewrite.</em>`

---

# Page 4 · Asset Management (/asset)

## Frontmatter

```yaml
slug: asset
order: 3
title: Asset Management
subtitle: The first FlytBase product that wasn't about the flight. It was about the asset.
year: 2025
role: Lead Product Designer · Reports page by Arpita
scope: Information architecture · Module design · Data model
tools: Figma · Lovable · Claude Code
status: shipped (M1)
```

## Case topbar

🔒 **Case label:** `CASE STUDY · 03 · Asset Management`

## Hero

🔒 **Eyebrow:** `— case study · 03 —`
🔒 **Title:** `Asset <em>Management</em>`
🔒 **Subtitle:** `The first FlytBase product that wasn't about the flight. It was about the asset.`

### Meta row

| Label | Value |
|---|---|
| Role | Lead Product Designer · Reports page by Arpita |
| Year | 2025 |
| Scope | Information architecture · Module design · Data model |
| Tools | Figma · Lovable · Claude Code |

🟠 **Hero image slot.** Assets dashboard showing nav rail + asset tree + map with pins + annotated zone polygon. 16:10.

## § 01 — Context

🔒 **Section label:** `Context <span class="num">§ 01</span>`
🔒 **H2:** `FlytBase had always been <em>flight-first.</em> This module wasn't.`
🔒 **Lead:** `Cockpit, Fleet, Mission Planning, Scheduler — every surface FlytBase had shipped until now was about the flight. The path the drone takes. The waypoints. The commands. Asset Management was the first time we were building a product that <em>doesn't care about the flight.</em>`

🔒 **Body:**
> Sarah Martinez runs operations at a midstream energy company. She's responsible for 45+ wellheads spread across 15 square miles in a North American oilfield. She schedules inspections, coordinates with maintenance teams, and files monthly compliance reports to regulators. She uses drones because they're faster and safer than sending people, but drones aren't her job. <em>The wellheads</em> are her job.

> Every week her boss asks her: *"When was wellhead NC-0217 last inspected?"* Sarah spends thirty minutes finding the answer. Not because the data doesn't exist — it does, somewhere — but because the software doesn't think about wellheads. It thinks about flights.

## § 02 — The problem

🔒 **Section label:** `The problem <span class="num">§ 02</span>`
🔒 **Pullquote:** `You could fly missions. You couldn't track <em>places.</em>`

🔒 **Body:**
> In the existing product, a wellhead existed only as a string inside a mission name: "Daily_wellhead_NC-0217_2025-03-14". The drone flew there, the inspection happened, the media was stored against that mission. But the wellhead itself was not a record. It had no ID. It had no history. It had no profile. It was just a word operators typed into mission names.

> This meant Sarah could answer "what mission happened last Tuesday" (easy — mission log). She could not answer "when was NC-0217 last inspected" without a full-text search through three months of mission names, crossed with dates, plus a manual check of the media library. Every compliance report required thirty minutes of detective work.

## § 03 — The shift

🔒 **Section label:** `The shift <span class="num">§ 03</span>`
🔒 **H2:** `Track the thing. <em>Not the flight.</em>`
🔒 **Lead:** `This sounds small. It wasn't. Every product surface FlytBase had shipped was flight-first — and this new module had to sit alongside them, in the same authentication, the same navigation, the same customer account, but operate on a <em>completely different axis.</em>`

🔒 **Body:**
> The signature decision was simple to state and hard to execute: <strong>assets are records. Flights reference them, not the other way around.</strong>

> A wellhead is no longer a string in a mission name. It's a first-class object with an ID, coordinates, a type, metadata, an inspection history, a media library, an alert profile. Missions reference the asset ID. Media is tagged with the asset ID. Reports aggregate by asset. The flight becomes a means; the asset is the end.

> Every product surface that previously referenced a flight now had to ask: does this also reference an asset? Cockpit's "Go To Location" became "Go To Asset." The scheduler's repeat-mission became repeat-inspection-for-asset. Over time, every flight-first surface got an asset-first equivalent.

## § 04 — Templatization (the payoff)

🔒 **Section label:** `Templatization <span class="num">§ 04</span>`
🔒 **H2:** `One profile. Applied to <em>dozens</em> of identical assets.`
🔒 **Lead:** `Once assets existed as records, reusable inspection profiles became possible for the first time.`

🔒 **Body:**
> Two types of inspection profiles:
> - **Grid inspection** (for area coverage). Parameters: area polygon, ground sample distance, overlap percentage. Used for large mat or field inspections.
> - **Viewpoints inspection** (for point features). Parameters: waypoint list, lens focal, zoom level, gimbal orientation. Used for discrete assets like wellheads, pylons, antennas.

> Each profile is defined once per asset type, then applied to any number of assets of that type. Setting up a new wellhead for inspection — a one-hour Figma-and-coordinate dance in the old world — collapsed to three clicks. Alert profiles work the same way: per-asset-type thresholds that fire consistently across every asset of that type.

🔒 **Callout:** `The payoff compounds. Every new asset is faster to onboard. Every new asset type is faster to define. Every change to a profile propagates to hundreds of assets at once.`

🟠 **Image slot 04 — profile types diagram.** Grid vs Viewpoints side-by-side.

## § 05 — The module

🔒 **Section label:** `The module <span class="num">§ 05</span>`
🔒 **H2:** `Five pages. Each one a slice of the same data.`
🔒 **Lead:** `The whole module is five left-rail pages, each answering a different question about the same underlying asset records.`

🔒 **Body:**
> The five pages:
> 1. **Assets** — the primary record view. Hierarchical tree (sector > site > asset), map with asset pins, zone polygons for compliance reporting.
> 2. **Inspection Logs** — history of every inspection, grouped by asset, by date, by pilot, by status.
> 3. **Media** — the full media library, queryable by asset and by date. Every photo, every video, every thermal pass.
> 4. **Reports** — compliance-ready exports. Shareable as PDF, link, or QR code. Designed by Arpita, prototyped in Lovable.
> 5. **Tag Management** — the tag taxonomy. Critical at scale: at 1000+ assets the tag vocabulary is its own design problem.

> Each page is a slice of the same asset data. The left-rail nav is the schema.

🟠 **Image slot 05 — five-page left rail.** Annotated screenshot showing the five pages.

## § 06 — What shipped

🔒 **Section label:** `What shipped <span class="num">§ 06</span>`
🔒 **H2:** `M1 live. The rest is building on top.`

🔒 **Body:**
> Milestone 1 shipped in Q3 2025 with all five pages, KML and CSV asset import (handling customer lists of 1000+ assets out of the gate), and the full report-distribution toolkit (PDF export, share link, QR code). It's FlytBase's second product — the first time the company shipped a module that didn't begin with "take off."

> Downstream wins arrived quickly. Cockpit's "Go To Location" became "Go To Asset" — a one-click workflow operators had been asking for for a year. A new "Quick Asset Inspect" flow appeared in Scheduler. The groundwork was laid for future ground-robot integrations that inspect assets without flying.

### Outcome grid

| Number | Label | Description |
|---|---|---|
| M1 | shipped | Five pages live. KML + CSV import. PDF / link / QR distribution. Q3 2025. |
| 1000+ | asset import | Handles enterprise customers' real-world asset counts on day one. |
| 2nd | product | FlytBase's second standalone product. First non-flight module. |

## § 07 — Reflection

🔒 **Section label:** `Reflection <span class="num">§ 07</span>`
🔒 **H2:** `Sometimes the problem isn't a feature. It's the <em>abstraction.</em>`

🔒 **Body:**
> The easy version of this brief would have been "add a wellhead dropdown to mission naming." That would have shipped in a week and made no one's life materially better. The hard version was "elevate assets to first-class records, then watch every other surface adapt over time." That shipped in months and changed the shape of the product.

> Designing something meant to create a category — not refine one — is different work. Less polish. More invention. More willingness to say "the right answer is to change the model, not the UI."

> Find the abstraction, and the features fall out of it.

## Artifacts on the canvas

- 🔒 **Context card** (§01). Label: `— the operational reality —`. Title: `45 wellheads. 15 square miles. <em>One</em> Operations Manager.`. Body: `She's responsible for the inspections, the compliance reports, the maintenance coordination. She uses FlytBase every day — but the wellheads are her job, not the drones.`
- 🔒 **Pink sticky** — Sarah's boss quote. Eyebrow: `— the question that doesn't have an answer —`. Body: `<em>"When was wellhead NC-0217 last inspected?"</em><br><br>She gets asked this every week. She spends thirty minutes every week finding out.`
- 🔒 **Principle card** (§03). Label: `— the abstraction that unlocks the module —`. Title: `Everything else FlytBase had built was about the <em>flight</em>. This one was about the <em>asset.</em>`
- 🔒 **Diagram** (§03) — the shift. Two-panel: flight-first on the left (FLIGHT at center, asset as ghost), asset-first on the right (ASSET at center in red, with five radiating children: inspections, media, profiles, alerts, reports). Captions below: `asset = string in mission name` vs `asset = record with a life.`
- 🔒 **Yellow sticky** (§04). Eyebrow: `— the profile types —`. Body: `<strong>Grid:</strong> area + GSD + overlap. For fields and mats.<br><strong>Viewpoints:</strong> waypoints + lens + zoom + gimbal. For discrete assets.`
- 🔒 **Printout** (§05) — hand-drawn rep of the five-page left rail, with asset tree (East sector · 3, South sector, Power lines · 1, North sector · 1), map with pins, annotated Zone Apex polygon.
- 🔒 **Blue sticky** near §05 (quiet Arpita attribution). Eyebrow: `— collaboration note —`. Body: `Reports — designed by Arpita. Prototyped in Lovable. I handed over the data model and integration points; she built the surface.`
- 🔒 **Yellow sticky** (§05). Eyebrow: `— the schema —`. Body: `Each page is a slice of the same data. <em>The navigation IS the schema.</em>`
- 🔒 **Green sticky** (§06). Eyebrow: `— M1 live —`. Body: `Five pages. 1000+ asset import. PDF / link / QR distribution. FlytBase's <em>second product.</em>`
- 🔒 **Green sticky** (§06). Eyebrow: `— compound returns —`. Body: `GoToLocation → GoToAsset. Quick Asset Inspect. Future ground-robot integrations. Each one is <em>free</em> once the abstraction is correct.`
- 🔒 **Green sticky** (§07). Eyebrow: `— the takeaway —`. Body: `Sometimes the problem isn't a feature. <em>It's the abstraction.</em> Find that, and the features fall out of it.`
- 🔒 **Blue sticky** (§07). Eyebrow: `— what was different —`. Body: `Designing something meant to <em>create</em> a category — not refine one — is different work. Less polish. More invention.`

---

# Global copy changes flagged for Sivanesh's attention

These are spots where the current prototype has placeholder or soft copy that Sivanesh may want to revise before the rebuild ships:

1. 🟠 **Hero image for every case study** — all three are currently SVG placeholders. Need real screenshots.
2. 🟠 **Profile photo** — currently a gradient-S initial. Replace with real photo.
3. 🟡 **Social links URLs** — prototype has placeholder href="#". Supply real LinkedIn / Read.cv / Twitter URLs.
4. 🟡 **Email address** — `hello@sivanesh.tv` assumed. Confirm.
5. 🟡 **Outcome grid numbers for Cockpit** (42%, 4 zones, v2) — the 42% is representative but if there's a real measured number, swap. Otherwise keep or drop.
6. 🟡 **Fleet CAA quote** — I've paraphrased "maintain situational awareness of all airframes." If Sivanesh has the exact quote from the waiver app, use it.
7. 🟡 **Asset context — Sarah Martinez name** — used in prose only, not as a labeled artifact. If this is a real person and you want it de-identified, rename to "a midstream ops manager" and drop the name.
8. 🟡 **Asset context — Devon Energy** — mentioned once in §01 prose, and in a reference to "a North American oilfield." Adjust if the real customer name should not appear.

---

# Style conventions (summary for copy reviewers)

- **`<em>` = red italic emphasis.** Use sparingly — 1–2 per sticky, 2–3 per section.
- **`<strong>` = semantic bold.** Use for in-paragraph key terms.
- **"Quotes in italic"** for direct speech.
- **— em dashes —** for interruption and emphasis. Do not use hyphens for this.
- **"three levels — critical, warning, informational"** — the inline dash-introducing-a-list pattern is a signature voice.
- **No Oxford comma (prototype is inconsistent; lean toward including it in the rebuild).**
