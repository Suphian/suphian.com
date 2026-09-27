/**
 * content.js: every user-facing string for suphian.com, edited for the redesign.
 *
 * Source of truth: C:\Users\suphi\dev\suphian.com (live site source).
 * Every change is logged in /COPY-CHANGES.md.
 *
 * Conventions
 * - Plain ES module, named exports only. No JSX, no TypeScript.
 * - Big section headings are arrays of lines: the UI joins them with <br />
 *   and appends the red period itself, so no heading ends in ".".
 *   Plain-text form: heading.join(' ') + '.'.
 * - Short labels (edition, cue, nav) are written in sentence case, and nothing
 *   uppercases them in CSS.
 * - The copyright year is not hard-coded: call footer.copyright().
 * - Asset paths are the real paths from suphian.com/public.
 *
 * Shape
 * site           { fullName, title, email, social: { linkedin, github } }
 * nav            { skip, home }
 * hero           { srTitle, edition: [3], cue: [2], cueHref }
 * story          { id, heading: [lines], intro, labels: { list, sideProjects, back },
 *                  chapters: [{ id, name, kind?, role, period, location, image: { src, nudge }, color, summary,
 *                  links: [{ label, href }] }] }
 *                  (replaces about, work and projects, 2026-09-26; jobs newest first, then the side
 *                  projects, kind: 'side')
 * contact        { title, signoff: { label }, requiredMark, optionalMark,
 *                  fields: { name|email|phone|message: { label, placeholder, required } },
 *                  validation: {...}, submit, sending, toasts: { success|rateLimited|error|blocked: { title, description } } }
 * footer         { copyright(year?), label, email: { label, href }, links: [{ label, href, ariaLabel }], backToTop }
 * seo            { origin, robots, lastModified, home: { title, description, ogTitle },
 *                  og: { type, siteName, image, imageAlt, locale }, twitter: { card, handle, image, imageAlt },
 *                  manifest: { name, description } }
 * structuredData { person, website }
 * errors         { boundary: { title, details, reload }, appLoad: { title, reload } }
 * common         { close, opensInNewTab }
 */

// ---------------------------------------------------------------------------
// Shared facts (kept exactly as the source states them)
// ---------------------------------------------------------------------------

const ORIGIN = 'https://suphian.com';
// Suphian's public email (2026-09-26): shown in the footer and used everywhere below.
const EMAIL = 'hello@suphian.com';
const LINKEDIN = 'https://www.linkedin.com/in/suphian/';
const GITHUB = 'https://github.com/Suphian';
// Footer "Email" link opens Gmail compose with a prefilled subject (from Footer.tsx).
const GMAIL_COMPOSE =
  'https://mail.google.com/mail/?view=cm&fs=1&to=hello@suphian.com&su=Hey,%20wanted%20to%20chat';

// Role update (2026-09-26): Principal PM at Steadily since July 2026; YouTube is past (2020 – 2026).
const HOME_TITLE = 'Suphian Tweel · Product, Payments & AI';
// Suphian 2026-09-27: "The Steadily thing isn't a big part of my identity. It's just my role."
// Search and social text lead with who he is: a product leader, payments at YouTube, then what he
// builds. Steadily stays a work chapter and the JSON-LD employer. AI is the site's positioning (the
// title and edition): never a claim about YouTube, and no Abacus AI facts are supplied yet, so none here.
// "Command center for MCA operators" is the Abacus chapter's own wording. 152 characters.
const HOME_DESCRIPTION =
  'Product leader. Led payments at YouTube, 2020 – 2026. Builds Abacus Labs, a command center for MCA operators, and something new every month at suph.app.';

// ---------------------------------------------------------------------------
// Site
// ---------------------------------------------------------------------------

export const site = {
  fullName: 'Suphian Tweel',
  // Visible under his name in the no-JavaScript profile (the first line non-rendering crawlers read)
  // and humans.txt. PROPOSAL (2026-09-27), pending Suphian's OK: identity first, not the current role.
  // Was 'Principal Product Manager, Steadily'.
  title: 'Product leader. Led payments at YouTube; builds Abacus Labs and suph.app.',
  email: EMAIL,
  social: {
    linkedin: LINKEDIN,
    github: GITHUB,
  },
};

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export const nav = {
  skip: 'Skip to main content',
  // Accessible name for the home link / docked SUPH wordmark.
  home: 'Suphian Tweel, back to top',
};

// ---------------------------------------------------------------------------
// Hero (new design slots)
// ---------------------------------------------------------------------------

export const hero = {
  // The page's h1 once React renders (visually hidden). Identity first, not the current role (Suphian 2026-09-27).
  srTitle: 'Suphian Tweel. Product leader. Previously led payments at YouTube. Builds Abacus Labs and suph.app.',
  edition: ['Product', 'Payments', 'AI'],
  cue: ['Scroll', 'for the story'],
  // The story index (story.id).
  cueHref: '#work',
};

// ---------------------------------------------------------------------------
// Work: the story index (replaces About, Work and Projects)
// ---------------------------------------------------------------------------

export const story = {
  // Section id: the hero cue scrolls here.
  id: 'work',
  // Suphian's own headline and intro (2026-09-26). Use exactly; the UI adds the red period.
  heading: ['Good ideas deserve', 'to get made'],
  intro:
    'I’m Suphian. I work in product and like turning ideas into things people can try, use, or enjoy. I care about how they work, how they look, and what happens when they meet the real world. In my free time I build cool stuff with Abacus Labs.',
  // No actions beside the intro (Suphian removed "Request resume", 2026-09-26).
  labels: {
    // The two lists' names: the jobs, then the side projects. sideProjects is also the
    // divider shown between them (Suphian: mark the side projects, 2026-09-26).
    list: 'Work',
    sideProjects: 'Side projects',
    back: 'Back',
  },
  // Jobs first, newest to oldest, then the side projects at the bottom (Suphian, 2026-09-26).
  // kind: 'side' marks a side project, not a job (Suphian: "these aren't my professional
  // projects, but rather my side projects"). Side projects are listed under a "Side projects"
  // divider and their role line reads "Side project". Every other chapter is a job.
  // Each chapter's open view is role, years, a summary and its links, in that order, and
  // nothing else (Suphian, 2026-09-26).
  // summary: the description from the old site (suphian.com ExperienceSection.tsx and
  // ProjectsSection.tsx) in his wording, with every AI claim about YouTube removed.
  // links: the old site's links, minus any that tie AI to YouTube.
  // image.src: the chapter's card, a white logo under public/work on the company color. If the
  // file is missing or fails to load, the card sets the name in type instead (StoryCard.jsx).
  // image.nudge: optical centring, a fraction of the logo's height (+ moves it down). Only a
  // descending "g" (Huge, Google) needs one: it puts the centre of the letters' mass (the ink
  // above the baseline) on the card's centre instead of the box's. The values are measured from
  // each SVG's own paths by src/story/logo-geometry.js, and logo-geometry.test.mjs fails if
  // they drift. Never guess them.
  // Every card is a logo card, suph.app's crown included (no screenshots, Suphian 2026-09-26).
  chapters: [
    {
      id: 'steadily',
      name: 'Steadily',
      role: 'Principal Product Manager',
      period: '2026 – Present',
      // Where he worked, shown in the open card after the years (Suphian, 2026-09-27).
      location: 'Austin, Texas',
      image: { src: '/work/steadily.svg', nudge: 0 },
      color: '#6C1D72', // Steadily purple: the card's fill (Suphian: company colors)
      // Not on the old site. Only the title, start date, Steadily's own description and the
      // link are confirmed; don't add scope, team, metrics or launches until Suphian supplies them.
      summary: 'Steadily sells landlord insurance for rental property owners and investors.',
      links: [{ label: 'Visit steadily.com', href: 'https://steadily.com' }],
    },
    {
      id: 'youtube',
      name: 'YouTube',
      role: 'Senior Product Manager',
      period: '2020 – 2026',
      location: 'New York City',
      image: { src: '/work/youtube.svg', nudge: 0 },
      color: '#FF0000', // YouTube red: the card's fill (Suphian: company colors)
      // Past role, past tense. He did NOT do AI at YouTube: "AI-powered payment system" → "payment system".
      summary:
        'Led execution of a payment system for high-profile launches including YouTube Shorts and YouTube Premium Lite. Managed over $6 billion in music payments, optimized global operations, and ensured compliance with regulatory and contractual obligations. Also led a major fraud detection initiative that surfaced and mitigated a royalty scam covered by Billboard.',
      links: [
        {
          label: 'YouTube Premium Lite launch',
          href: 'https://blog.youtube/news-and-events/introducing-premium-lite/',
        },
        {
          label: 'YouTube Shorts revenue sharing',
          href: 'https://blog.youtube/inside-youtube/shorts-revenue-sharing-update/',
        },
        {
          label: 'Billboard: YouTube royalty scam',
          href: 'https://www.billboard.com/pro/youtube-fraud-royalties-scam-irs-latin-chenel-yenddi-mediamuv-adrev/',
        },
        {
          label: 'YouTube: $6B paid to the music industry',
          href: 'https://blog.youtube/creator-and-artist-stories/6-billion-paid-to-the-music-industry-in-12-months/#:~:text=In%20the%2012%20months%20between,B%20to%20the%20music%20industry.&text=Last%20year%20we%20announced%20a,B%20to%20the%20music%20industry.',
        },
        // The old site's fifth link, "Google Research: zero-resource machine translation", is
        // machine-learning research; listed here it read as AI work at YouTube, so it is out
        // (logged in COPY-CHANGES.md for Suphian to confirm).
      ],
    },
    {
      id: 'google',
      name: 'Google',
      role: 'Principal Analytical Lead',
      period: '2018 – 2020',
      location: 'Ann Arbor, Michigan',
      image: { src: '/work/google.svg', nudge: 0.018 },
      color: '#4285F4', // Google blue: the card's fill (Suphian: company colors)
      summary:
        'Served as an in-house analytics advisor for CapitalG portfolio companies and high-growth D2C brands. Led incrementality testing and optimization strategies to improve marketing efficiency and scale growth across platforms like Duolingo and Chewy.com.',
      links: [
        {
          label: 'Chewy IPO announcement',
          href: 'https://investor.chewy.com/news-and-events/news/news-details/2019/Chewy-Announces-Pricing-of-Initial-Public-Offering/default.aspx',
        },
        {
          label: 'Duolingo Series D',
          href: 'https://www.cmu.edu/project-olympus/news/2015/june/duolingo-raises-45-million-series-d-round-led-by-google-capital-now-valued-at-470m.html',
        },
      ],
    },
    {
      id: 'huge',
      name: 'Huge',
      role: 'Senior Product Analyst',
      period: '2014 – 2018',
      location: 'DUMBO, Brooklyn',
      image: { src: '/work/huge.svg', nudge: 0.026 },
      color: '#FF0090', // Huge magenta: the card's fill (Suphian: company colors)
      summary:
        'Specialized in site redesigns, A/B testing, and multivariate testing for high-impact brands. Helped improve UX and conversion for companies like Hulu, Apple and AMC Theaters.',
      links: [
        { label: 'Huge: work for Google', href: 'https://www.hugeinc.com/work/google/' },
        {
          label: 'Bain Capital: Canada Goose IPO',
          href: 'https://www.baincapital.com/news/900-parkas-bains-canada-goes-public',
        },
        { label: 'Hulu redesign', href: 'https://workingnotworking.com/projects/112837-hulu-redesign' },
        { label: 'Apple: Beats case study', href: 'https://elephant.is/case-study/beats/' },
      ],
    },
    // Side projects (kind: 'side'), below the jobs.
    {
      id: 'abacus',
      name: 'Abacus Labs',
      // His free-time project, not a job (see the intro line): the role line says so.
      kind: 'side',
      role: 'Side project',
      period: 'Current',
      location: 'Internet', // Suphian: the side projects' location "can be internet"
      // A raster mark with even 4px margins on every side and no descender: nothing to nudge.
      image: { src: '/work/abacus-white.png', nudge: 0 },
      color: '#000000', // Abacus Labs black: the card's fill (Suphian: company colors)
      summary:
        'Abacus turns spreadsheet chaos into a real-time command center for MCA operators — deals, underwriting, collections, syndication, and compliance in one place. I lead product and engineering.',
      links: [{ label: 'Visit abacuslabs.co', href: 'https://abacuslabs.co' }],
    },
    {
      id: 'suph-app',
      name: 'suph.app',
      // Suphian: "Every month I make something." A side project, not a job.
      kind: 'side',
      role: 'Side project',
      period: 'New build every month',
      location: 'Internet',
      // The game's crown emblem as a white mark, like the other logos (Suphian: "just put the crown logo").
      // A mark with no descender: its measured nudge is 0.
      image: { src: '/work/suph-app.svg', nudge: 0 },
      color: '#AC8243', // the deep gold from the game's own crown gradient
      // Facts from Suphian's note and the game's README (dev/ceoisdead/README.md); nothing else.
      // "This month" names the current build: update the sentence when a new one ships.
      summary:
        'Every month I make something. This month it’s The Toga Is Dead, a 3D board game you play in the browser: 2–4 players, with solo practice, same-screen play and online invitations, set in a medieval coastal kingdom or the Roman empire.',
      links: [{ label: 'Play The Toga Is Dead', href: 'https://suph.app' }],
    },
  ],
};

// ---------------------------------------------------------------------------
// Contact (the sheet, and the SAY HELLO sign-off that opens it)
// ---------------------------------------------------------------------------

export const contact = {
  title: 'Contact',
  // Hand-lettered SAY HELLO art at the bottom of the section; it opens the sheet.
  signoff: {
    label: 'Say hello: open the contact form',
  },
  requiredMark: '*',
  optionalMark: '(optional)',
  fields: {
    name: { label: 'Name', placeholder: 'Your name', required: true },
    email: { label: 'Email', placeholder: 'you@example.com', required: true },
    phone: { label: 'Phone', placeholder: '+1 (555) 123-4567', required: false },
    message: { label: 'Message', placeholder: 'Hey, what’s up? Talk to me.', required: true },
  },
  // Limits mirror contactFormSchema.ts.
  validation: {
    nameMin: 'Name must be at least 2 characters.',
    nameMax: 'Name must be 100 characters or less.',
    emailInvalid: 'Enter a valid email address, like name@example.com.',
    emailMax: 'Email must be 160 characters or less.',
    phoneInvalid: 'Enter a valid phone number, like +1 555 123 4567.',
    phoneMax: 'Phone must be 48 characters or less.',
    messageMin: 'Message must be at least 10 characters.',
    messageMax: 'Message must be 2,500 characters or less.',
    // Honeypot field; only bots see this.
    bot: 'Bot submission detected.',
  },
  submit: 'Send message',
  sending: 'Sending…',
  toasts: {
    success: {
      title: 'Message sent',
      description: 'Thanks. I’ll get back to you soon.',
    },
    // Matches checkRateLimit(clientId, 'contact_form', 3) with its 60-minute default window.
    rateLimited: {
      title: 'Too many messages',
      description: `You can send 3 messages an hour. Try again later, or email me at ${EMAIL}.`,
    },
    error: {
      title: 'Message not sent',
      description: `Something went wrong. Try again, or email me at ${EMAIL}.`,
    },
    // Honeypot tripped; only bots see this.
    blocked: {
      title: 'Submission blocked',
      description: 'Bot detected.',
    },
  },
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const footer = {
  /** UI inserts the current year: footer.copyright() -> "© 2026 Suphian Tweel". */
  copyright: (year = new Date().getFullYear()) => `© ${year} Suphian Tweel`,
  label: 'Social links',
  // Shown under the links (Suphian, 2026-09-26).
  email: { label: EMAIL, href: `mailto:${EMAIL}` },
  links: [
    { label: 'Email', href: GMAIL_COMPOSE, ariaLabel: 'Email Suphian (opens Gmail in a new tab)' },
    { label: 'LinkedIn', href: LINKEDIN, ariaLabel: 'Suphian’s LinkedIn profile (opens in a new tab)' },
    { label: 'GitHub', href: GITHUB, ariaLabel: 'Suphian’s GitHub profile (opens in a new tab)' },
  ],
  backToTop: 'Back to top',
};

// ---------------------------------------------------------------------------
// SEO (index.html via scripts/seo.mjs, site.webmanifest, crawler text files)
// ---------------------------------------------------------------------------

export const seo = {
  origin: ORIGIN,
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  // The homepage's last real content or metadata change: the sitemap <lastmod> and the
  // ProfilePage dateModified. Bump it with the copy, never on every build (Google only
  // trusts lastmod that stays accurate).
  lastModified: '2026-09-27',
  home: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    // One title everywhere: index.html and SEOHead used to disagree.
    ogTitle: HOME_TITLE,
  },
  og: {
    type: 'profile',
    siteName: 'Suphian Tweel',
    // A square source fills messaging thumbnails; the centered lettering also fits a wide crop.
    // Change the filename when replacing artwork so clients don't reuse a cached image.
    image: `${ORIGIN}/og/suphian-share-20260927-v2.png`,
    imageWidth: 1200,
    imageHeight: 1200,
    imageAlt: 'SUPHIAN in inflated red letters on black.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    handle: '@suphian',
    image: `${ORIGIN}/og/suphian-wide-20260927-v2.png`,
    imageAlt: 'SUPHIAN in inflated red letters on black.',
  },
  manifest: {
    name: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
};

// ---------------------------------------------------------------------------
// Structured data (scripts/seo.mjs generates the JSON-LD in the initial HTML)
// ---------------------------------------------------------------------------

export const structuredData = {
  person: {
    name: 'Suphian Tweel',
    givenName: 'Suphian',
    familyName: 'Tweel',
    description: HOME_DESCRIPTION,
    // His current role, stated accurately; it no longer leads the description (Suphian 2026-09-27).
    jobTitle: 'Principal Product Manager',
    worksFor: { name: 'Steadily', url: 'https://steadily.com' },
    // The side project he leads product and engineering for (the Abacus chapter). Affiliation
    // only: no founder, owner or employer claim.
    affiliation: [{ name: 'Abacus Labs', url: 'https://abacuslabs.co' }],
    // The canonical homepage URL, trailing slash included, like the ProfilePage and <link rel="canonical">.
    url: `${ORIGIN}/`,
    email: EMAIL,
    sameAs: [LINKEDIN, GITHUB],
    knowsAbout: ['Product Management', 'Payments', 'Artificial Intelligence', 'Fraud Detection', 'Data Analytics'],
  },
  website: {
    name: 'Suphian Tweel',
    url: `${ORIGIN}/`,
    description: HOME_DESCRIPTION,
    inLanguage: 'en-US',
  },
};

// ---------------------------------------------------------------------------
// Errors and fallbacks
// ---------------------------------------------------------------------------

export const errors = {
  // ErrorBoundary.jsx
  boundary: {
    title: 'Something went wrong',
    details: 'Error details',
    reload: 'Reload page',
  },
  // main.jsx mount failure
  appLoad: {
    title: 'The site failed to load',
    reload: 'Reload page',
  },
};

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

export const common = {
  close: 'Close',
  opensInNewTab: '(opens in a new tab)',
};

// ---------------------------------------------------------------------------
// Added by features port
// Strings the ported features need that the approved copy above did not cover.
// ---------------------------------------------------------------------------

export const dev = {
  // Fixed pill shown locally while the contact form runs as a dry run.
  dryRun: 'Local · dry-run',
};

export const serviceWorker = {
  // Native confirm() when a new deploy's service worker installs (verbatim from serviceWorker.ts).
  updatePrompt: 'New version available. Refresh to update?',
};
