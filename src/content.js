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
 *                  chapters: [{ id, name, kind?, role?, period, location, image: { src, nudge }, color, accent?,
 *                  summary, links: [{ label, href }] }] }
 *                  (replaces about, work and projects, 2026-09-26; jobs newest first, then the side
 *                  projects, kind: 'side')
 *                  A chapter made of builds (suph.app's projects, 2026-09-28) has builds instead of an image:
 *                  builds: [{ month: 'YYYY-MM', slug, name, summary, image: { src, nudge }, color?, links }],
 *                  newest first. Its open card is the usual role (if any), years and summary, then one
 *                  row per build in place of the links; its own links are for the no-JavaScript profile
 *                  and llms-full.txt. accent: the marks' color when the card color is too dark to see on
 *                  the page (logic.js accentOf).
 * contact        { title, signoff: { label }, requiredMark, optionalMark,
 *                  fields: { name|email|phone|message: { label, placeholder, required } },
 *                  validation: {...}, submit, sending, toasts: { success|rateLimited|error|blocked: { title, description } } }
 * footer         { copyright(year?), label, email: { label, href }, links: [{ label, href, ariaLabel }], backToTop }
 * seo            { origin, robots, lastModified, home: { title, description, ogTitle, ogDescription },
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
// Search text leads with who he is: a product leader, payments at YouTube, then what he
// builds. Steadily stays a work chapter and the JSON-LD employer. AI is the site's positioning (the
// title and edition): never a claim about YouTube, and no Abacus AI facts are supplied yet, so none here.
// "Command center for MCA operators" is the Abacus chapter's own wording. suph.app makes no
// monthly promise (Suphian 2026-09-28: weekend experiments he doesn't plan to support).
// 153 characters.
const HOME_DESCRIPTION =
  'Product leader. Led payments at YouTube, 2020 – 2026. Founder of Abacus Labs, a command center for MCA operators. Shares weekend experiments at suph.app.';

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
  // Suphian's own headline and intro (2026-09-26, intro reworded 2026-09-29). Use exactly; the UI adds the red period.
  heading: ['Good ideas deserve', 'to get made'],
  intro:
    'I’m Suphian. I work in product and I like to turn ideas into things people can try, use, and enjoy. I care about how they work, how they look, and what happens when they meet the real world. I also founded Abacus Labs, and suph.app is where I play with new ideas.',
  // No actions beside the intro (Suphian removed "Request resume", 2026-09-26).
  labels: {
    // The two lists' names: the jobs, then his own ventures. sideProjects is also the
    // divider shown between them. Suphian 2026-09-28: not "side projects" (Abacus Labs is a
    // company he founded and earns from), so the divider reads "Studio".
    list: 'Work',
    sideProjects: 'Studio',
    back: 'Back',
  },
  // Jobs first, newest to oldest, then his own ventures at the bottom (Suphian, 2026-09-26).
  // kind: 'side' marks one of his own ventures, not a job. They are listed under the
  // "Studio" divider. Abacus Labs' role line says what he is there, Founder; suph.app has no
  // role at all (Suphian 2026-09-28: "Maybe I don't need a title on it"). Every other chapter is a job.
  // Each chapter's open view is role, years, a summary and its links, in that order, and
  // nothing else (Suphian, 2026-09-26). suph.app skips the role and lists its projects in
  // place of the links.
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
      image: { src: '/work/steadily.svg', width: 547.58, height: 68.91, nudge: 0 },
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
      image: { src: '/work/youtube.svg', width: 89.58, height: 20, nudge: 0 },
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
      image: { src: '/work/google.svg', width: 269.63, height: 88.76, nudge: 0.018 },
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
      image: { src: '/work/huge.svg', width: 98.42, height: 41.6, nudge: 0.026 },
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
    // His own ventures (kind: 'side'), below the jobs, under "Studio".
    {
      id: 'abacus',
      name: 'Abacus Labs',
      // Suphian 2026-09-28: "I'm the founder of Abacus… I started and built it… we make
      // money on it." An MCA tool with paying customers; he isn't scaling it.
      kind: 'side',
      role: 'Founder',
      period: 'Current',
      location: 'Internet', // Suphian: the studio's location "can be internet"
      // A raster mark with even 4px margins on every side and no descender: nothing to nudge.
      image: { src: '/work/abacus-white.png', width: 748, height: 467, nudge: 0 },
      color: '#000000', // Abacus Labs black: the card's fill (Suphian: company colors)
      summary:
        'Abacus turns spreadsheet chaos into a real-time command center for MCA operators — deals, underwriting, collections, syndication, and compliance in one place. I founded it, built it, and run it for paying customers.',
      links: [{ label: 'Visit abacuslabs.co', href: 'https://abacuslabs.co' }],
    },
    {
      id: 'suph-app',
      name: 'suph.app',
      // Suphian 2026-09-28: "With the same format as Abacus Labs, like founder, current,
      // internet. I like that format", then "Maybe I don't need a title on it". So no role: the
      // row reads "Current", and the open card is the years line and the summary like every
      // chapter (no role line), with the projects in place of its links.
      kind: 'side',
      period: 'Current',
      location: 'Internet',
      // Suphian 2026-09-28: "maybe green, the kind of forest green that the Quran website uses"
      // (suph.app/quran's --ink). The card's fill, and every project token's unless it sets its own.
      color: '#243F39',
      // That green is too dark to see as a mark on the near-black page (about 1.7:1), so the marks
      // take the Quran site's pale sage instead (9.7:1 on #080808).
      accent: '#AAB8A7',
      // His words, lightly tightened (Suphian 2026-09-28). No monthly promise: he doesn't want to
      // commit to a project every month, and he doesn't plan to support them.
      summary:
        'Small things I build to explore. When a new model or tool comes out, I like to spend a weekend with it and use it to solve a real problem. I don’t plan to support them; they’re experiments I think are worth sharing.',
      // For the no-JavaScript profile and llms-full.txt: the open card shows the projects instead
      // (Suphian: "Just keep the projects").
      links: [{ label: 'Visit suph.app', href: 'https://suph.app' }],
      // Suphian 2026-09-28: "When you click the suph.app card you should see all of my projects,
      // and it should say the month." One entry per project, newest first; month is when it was
      // made, not a schedule. The rail card shows the newest project's icon. The open card lists
      // every project, one line each (Suphian: "Condense"), and its image panel shows the newest,
      // or the project under a mouse or keyboard focus. The no-JavaScript profile and
      // llms-full.txt list them all too, with their summaries.
      //
      // Adding a project: put it at the TOP of this list:
      //   { month: 'YYYY-MM', slug, name, summary, image: { src, nudge }, color?, links: [{ label, href }] }
      // - month: the month he made it. The site writes it out ("October 2026").
      // - slug: short, lowercase and unique. suph.app (live 2026-09-28) has one page per build at
      //   suph.app/<slug> (suph.app/toga, suph.app/quran); a new build links to its page there.
      // - image: a white mark in public/work with a viewBox tight to its ink (assets-src/work/README.txt);
      //   `node --test src/story/` measures its nudge. color: optional, the card's fill (white must reach 3:1 on it).
      // - summary: only facts Suphian has confirmed, without repeating the name. The open card
      //   doesn't show it (screen readers hear it); the no-JS profile and llms-full.txt do.
      // - links: its page, https://suph.app/<slug>. The card's row links to the first one.
      // Then log the copy in COPY-CHANGES.md, run `node scripts/sync-seo.mjs` and `npm test`.
      builds: [
        {
          // Suphian 2026-09-28: "'Play The Toga Is Dead' should be from last month", August 2026.
          month: '2026-08',
          slug: 'toga',
          name: 'The Toga Is Dead',
          // Facts from Suphian's note and the game's README (dev/ceoisdead/README.md); nothing else.
          summary:
            'A 3D board game you play in the browser: 2–4 players, with solo practice, same-screen play and online invitations, set in a medieval coastal kingdom or the Roman empire.',
          // The game's crown emblem as a white mark, like the other logos (Suphian: "just put the crown logo").
          // A mark with no descender: its measured nudge is 0.
          image: { src: '/work/suph-app.svg', width: 76, height: 59, nudge: 0 },
          // Suphian 2026-09-28: suph.app is now a hub with a page per project.
          links: [{ label: 'Play The Toga Is Dead', href: 'https://suph.app/toga' }],
        },
        {
          // Suphian 2026-09-28: "'the Quran GitHub' should be from the previous month", July 2026.
          // His month, not the repo's commit dates (github.com/Suphian/quran-art).
          month: '2026-07',
          slug: 'quran',
          name: 'Quran Art',
          // From the repo's README only. Its dataset attribution looks wrong, so the source isn't named.
          summary:
            'Simple geometric artwork from how the Qur’an uses Arabic demonstratives, words like hādhā (“this”): one image per surah, gathered in a gallery.',
          // placeholder icon until Suphian supplies artwork: an eight-point star of two squares,
          // with no descender (nudge 0).
          image: { src: '/work/quran-art.svg', width: 100, height: 100, nudge: 0 },
          links: [{ label: 'See Quran Art', href: 'https://suph.app/quran' }],
        },
      ],
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
  lastModified: '2026-09-29', // the intro changed ("I like to turn ideas into things…")
  home: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    // Concise text for a conversation card, kept with the Signature design. Suphian
    // 2026-09-28: LinkedIn's card read "Suphian Tweel / Suphian Tweel" (the title, then the
    // site name), so the title says what he does and the site name is the domain.
    ogTitle: HOME_TITLE,
    ogDescription: 'Currently at Steadily. Led payments at YouTube. Founder of Abacus Labs.', // Suphian 2026-09-28: "definitely currently at Steadily"
  },
  og: {
    type: 'profile',
    siteName: 'suphian.com',
    // Signature's centered full name fits both square thumbnails and wide crops.
    // Change the filename when replacing artwork so clients don't reuse a cached image.
    image: `${ORIGIN}/og/suphian-signature-square-20260927.png`,
    imageWidth: 1200,
    imageHeight: 1200,
    imageAlt: 'The full SUPHIAN wordmark in red on a softly lit dark background.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    handle: '@suphian',
    image: `${ORIGIN}/og/suphian-signature-wide-20260927.png`,
    imageAlt: 'The full SUPHIAN wordmark in red on a softly lit dark background.',
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
    // The social card's square Signature artwork. There is no portrait photo, so none is claimed.
    image: seo.og.image,
    // His current role, stated accurately; it no longer leads the description (Suphian 2026-09-27).
    jobTitle: 'Principal Product Manager',
    worksFor: { name: 'Steadily', url: 'https://steadily.com' },
    // The side project he leads product and engineering for (the Abacus chapter). Affiliation
    // only: no founder, owner or employer claim.
    affiliation: [{ name: 'Abacus Labs', url: 'https://abacuslabs.co' }],
    // His earlier jobs, the work chapters before Steadily.
    alumniOf: [
      { name: 'YouTube', url: 'https://www.youtube.com' },
      { name: 'Google', url: 'https://www.google.com' },
      { name: 'Huge', url: 'https://www.hugeinc.com' },
    ],
    // The canonical homepage URL, trailing slash included, like the ProfilePage and <link rel="canonical">.
    url: `${ORIGIN}/`,
    email: EMAIL,
    // His profiles, and suph.app, where he shares his weekend experiments.
    sameAs: [LINKEDIN, GITHUB, 'https://suph.app'],
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
