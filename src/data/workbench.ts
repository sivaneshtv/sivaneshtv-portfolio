/**
 * Workbench composition data — verbatim from PROTOTYPE-REFERENCE.md §7.
 * Every position, rotation, dimension, and copy string is from the prototype HTML.
 */

export const zones = {
  hello:   { cx: 2313, cy: 1910, scale: 0.90 },
  about:   { cx: 900,  cy: 2135, scale: 0.65 },
  work:    { cx: 3870, cy: 2065, scale: 0.72 }, // cy raised so label sits ~100px below topbar on large screens
  howwork: { cx: 1700, cy: 3465, scale: 0.84 },
  contact: { cx: 4200, cy: 3540, scale: 0.90 },
} as const;

// Mobile zone overrides — absolute cx/cy/scale for ≤520 px screens.
// cx/cy are canvas coords; scale is the literal zoom (no multiplier applied).
export const mobileZones = {
  hello:   { cx: 2313, cy: 1910, scale: 0.40 },
  about:   { cx: 900,  cy: 2135, scale: 0.45 },
  work:    { cx: 3920, cy: 2180, scale: 0.45 }, // cy raised so cluster sits higher on phone screen
  howwork: { cx: 1600, cy: 3465, scale: 0.44 },
  contact: { cx: 3950, cy: 3550, scale: 0.70 }, // 70% zoom centred on contact card; sticky off-screen right
} as const;

export const zoneBounds = {
  hello:   { x1: 1800, y1: 1380, x2: 3300, y2: 2400 },
  about:   { x1:  380, y1: 1500, x2: 1450, y2: 2700 },
  work:    { x1: 3400, y1: 1380, x2: 4800, y2: 2700 },
  howwork: { x1: 1050, y1: 2900, x2: 2400, y2: 4000 },
  contact: { x1: 3500, y1: 3200, x2: 4800, y2: 4000 },
} as const;

export const zoneNav = [
  { id: 'hello', label: 'Hello' },
  { id: 'about', label: 'About' },
  { id: 'work', label: 'Work' },
  { id: 'howwork', label: 'How I work' },
  { id: 'contact', label: 'Say hi' },
];

// §7.1 — Zone labels
export const zoneLabels = [
  { x: 2100, y: 1420, size: 72, rotation: -2, html: '— hello —' },
  { x: 3600, y: 1440, size: 120, rotation: -1, html: 'the <em>work</em>' },
  { x: 1200, y: 3000, size: 96, rotation: 1, html: 'how <em>I</em> work' },
  { x: 3700, y: 3240, size: 96, rotation: -1, html: 'say <em>hi</em>' },
  { x: 580, y: 1520, size: 96, rotation: -1, html: 'about <em>me</em>' },
];

// §7.2 — Masthead (position baked into CSS: left:2100, top:1600, rotate(-1deg))
export const masthead = {
  eyebrow: 'hey, I\'m —',
  title: 'Sivanesh <em>TV</em>,<br>a designer<br>who <span class="strike">talks</span> <em>ships.</em>',
  sub: 'Product design for <em>critical operations</em> — safety-critical systems, fleet tools, interfaces where a wrong tap costs more than time. Based in Chennai · open to briefs.',
};

// §7.3 — Photo
export const photo = {
  x: 1830, y: 1640, rotation: -5,
  char: 'S',
  caption: '— that\'s me, Chennai IN —',
};

// §7.5 — About stickies
export const aboutStickies = {
  whoIAm: {
    x: 500, y: 1760, rotation: 3, width: 300, variant: 'pink' as const,
    eyebrow: '— in my own words —',
    body: 'A product designer who cares about <em>structure</em> more than surface. Happiest when the problem is fuzzy, the stakes are real, and the answer is a rule — not a mood board.',
  },
  belief: {
    x: 980, y: 1820, rotation: -3, width: 260, variant: 'yellow' as const,
    eyebrow: '— what I hold to —',
    body: 'Structure <em>before</em> style. Always. Style is how structure <em>shows itself.</em>',
  },
  music: {
    x: 730, y: 2440, rotation: -2, width: 240, variant: 'green' as const,
    eyebrow: '— always on —',
    body: 'Pop, K-pop, J-pop, EDM. The genre changes by the hour. The headphones stay.',
  },
};

// §7.6 — How-I-work
export const howIWork = {
  card: {
    x: 1200, y: 3180, rotation: -1.5,
    title: 'how <span style="font-style:italic;color:var(--marker-red)">I</span> actually work',
    sub: '— typical week —',
    rows: [
      { label: 'Sit close with CS + PM', value: 'calls, transcripts' },
      { label: 'Turn findings into structure', value: 'IA, flows, rules' },
      { label: 'Prototype in the real tool', value: 'Figma / Claude / Lovable' },
      { label: 'Pair with engineering', value: 'daily, ship weeks' },
      { label: 'Deep work', value: '<em>10:00 – 14:00 IST</em>' },
      { label: 'Collab hours', value: '15:00 – 18:00 IST' },
    ],
  },
  todo: {
    x: 1730, y: 3200,
    title: 'what I <em>practice</em>',
    sub: '— the verbs —',
    items: [
      { text: 'Absorb', done: true },
      { text: 'Structure', done: true },
      { text: 'Prototype', done: true },
      { text: 'Systematise', done: true },
      { text: 'Ship', done: true },
      { text: 'Critique', done: true },
    ],
  },
  toolsSticky: {
    x: 1200, y: 3600, rotation: 2, width: 240, variant: 'blue' as const,
    eyebrow: '— tools —',
    body: 'Figma · <em>Claude suite</em> · Lovable · Cursor · AI Studio · Flow.',
  },
  whatIBring: {
    x: 1730, y: 3620, rotation: -2.5, width: 260, variant: 'pink' as const,
    eyebrow: '— what I bring to a team —',
  },
};

// §7.7 — Work zone
export const workZone = {
  clickHint: { x: 3680, y: 1620, rotation: -4, size: 22 },
  workNote: {
    x: 4450, y: 1710, rotation: -4, width: 220, variant: 'green' as const,
    eyebrow: '— 3 cases · many more shipped —',
    body: 'These three are <em>written up.</em> Plenty more lives inside <em>FlytBase\'s</em> enterprise product — happy to walk through.',
  },
  polaroids: [
    {
      x: 3500, y: 1700, rotation: -3, href: '/cockpit',
      caption: 'Cockpit View <em>2.0</em>', meta: '2026 · Drone Autonomy',
    },
    {
      x: 3920, y: 1950, rotation: 4, href: '/fleet',
      caption: 'Fleet <em>View</em>', meta: '2025 · Fleet Operations',
    },
    {
      x: 3490, y: 2200, rotation: 2, href: '/asset',
      caption: 'Asset <em>Management</em>', meta: '2025 · Infrastructure-first module',
    },
  ],
};

// §7.8 — Contact zone (email/socials from DECISIONS.md)
export const contactZone = {
  card: {
    x: 3800, y: 3420,
    title: 'if this <em>clicked</em> — say hi.',
    body: 'Taking briefs in Q2 \'26. Short contracts, design lead roles, advisory, pair-thinking sessions. Drop a line — I read everything.',
    email: 'hello@sivanesh.tv',
    emailHref: 'mailto:sssiva.1999@gmail.com',
    socials: [
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/sivanesh-t-v-product-designer' },
      { label: 'Read.cv', url: '/resume.pdf' },
      { label: 'Twitter', url: 'https://x.com/dunkadamics' },
    ],
  },
  availSticky: {
    x: 4380, y: 3520, rotation: -3, width: 220,
    eyebrow: '— availability —',
    body: 'Open to <em>Q2 \'26</em> briefs. Chennai-based, work across IST hours.',
  },
};
