# Copy changes

Source: `dev/suphian.com` (live site). Output: `src/content.js`.

**Conventions (not repeated below):**
- Straight quotes are now curly (’ “ ”) and `...` is now `…`.
- Year ranges use en dashes: `2020 – Present`.
- Buttons and labels use sentence case. (The design used to uppercase them; the new type brief doesn't.)
- Headings are stored as arrays of lines, and the UI adds the red period.
- The copyright year comes from `footer.copyright()`.

---

## Studio, not side projects (2026-09-28, latest)

Suphian had feedback that "side project" undersells it: "I'm the founder of Abacus… I started and built it… we make money on it. We're not scaling it. suph.app is literally just for me to play around with." He chose "Studio" for the divider.

| Field | Was | Now |
|---|---|---|
| Divider between jobs and his own ventures | Side projects | Studio |
| Abacus Labs role line | Side project · Current · Internet | Founder · Current · Internet |
| Abacus Labs summary, last sentence | I lead product and engineering. | I founded it, built it, and run it for paying customers. |
| suph.app role line | Side project · New build every month · Internet | Playground · New build every month · Internet |
| Story intro, last sentence | In my free time I build cool stuff with Abacus Labs. | I also founded Abacus Labs, and suph.app is where I play with new ideas. |
| Meta/OG/Twitter description | … Builds Abacus Labs, a command center for MCA operators, and something new every month at suph.app. | … Founder of Abacus Labs, a command center for MCA operators. Builds something new every month at suph.app. |
| llms.txt | side projects at Abacus Labs and suph.app | studio: Abacus Labs, which he founded, and suph.app |

The customer count (two) is deliberately not published; the copy says "paying customers".

## Signature messaging preview (2026-09-27)

After a real WhatsApp screenshot showed Editorial cropped into a square thumbnail, Suphian
chose the full Signature design for both WhatsApp and iMessage. The primary image is now square,
with the full red SUPHIAN centered inside the area shared by square and wide crops. Twitter
gets a dedicated landscape export. The dark gradient, subtle diagonal and homepage vector
lettering keep Signature's original design. Social title and description remain unchanged;
alt text now describes Signature. Both asset URLs are fresh.

All three original designs remain saved. The review studio now includes the compact square
WhatsApp layout that exposed this issue, alongside the wide mockups, and identifies Signature
as selected. These simulations test composition, not native-app behavior.

## Editorial messaging preview (2026-09-27, superseded selection)

Suphian chose Editorial after reviewing Signature, Editorial and Contrast, and asked to save all
three. The review gallery, PNGs and reproducible renderer live in `design/social-preview/` and
`scripts/render-preview-directions.mjs`. The selected 1200 × 630 full-color PNG is published
without re-encoding: the homepage statement on the left, full red SUPHIAN wordmark on the right.

The Open Graph and Twitter title is now **Suphian Tweel**; the description is **Product, payments
& AI. Good ideas deserve to get made.** Search descriptions and structured profile copy stay as
recorded below. Image alt text describes the complete Editorial composition. Both social metadata
formats point to the same new image URL; older image URLs remain available for cached cards.

## Messaging previews (2026-09-27, superseded design)

The preview keeps the approved SUPHIAN lettering and existing title, description and alt text.
The primary Open Graph image is now a versioned 1200 × 1200 PNG with the wordmark at 90% width;
its centered 1200 × 630 crop also preserves the entire name. Twitter uses a separate landscape
export. Fresh filenames prevent reuse of the previous image asset when clients fetch the updated
metadata; already cached messages may retain their original card.
Suphian requested a professional, high-fidelity result using the homepage's full name. The
export now reads the homepage's vector source directly, retaining its gradient and subtle
surface texture, renders at 2×, and downsamples to a compact palette PNG with crisp red edges.

## Contact emails: generic and on brand (2026-09-27, latest)

Suphian: "I don't love that contact email… Just be like 'Looking forward to connecting.' It should be more generic." The moon/orbit theme, the 🌕 subject and the "Principal Product Manager at Steadily" sign-off are gone. The copy lives in `supabase/functions/notify-contact-submit/emails.ts`, and it goes live only when that function is deployed to Supabase, not through Vercel.

| Field | Was (live until the function redeploys) | Now |
|---|---|---|
| Thank-you subject | 🌕 Your message reached my inbox! | Thanks for reaching out |
| Preview line | (none) | Your message came through. Looking forward to connecting. |
| Heading | Thanks for reaching out, Jane. | Thanks for reaching out, Jane. |
| Body | Your message just completed its orbit and landed in my inbox. I'll get back to you soon. | Your message came through. Looking forward to connecting. / If you think of anything to add, just reply to this email. |
| Sign-off | Suphian / Principal Product Manager at Steadily | Suphian |
| Owner notification | Contact Notification: "Contact Form Submission" | suphian.com: "New message from {name}" |

## Identity first, Steadily as the role (2026-09-27)

Newest entry; where older sections disagree, this one wins. Suphian: "The Steadily thing isn't a big part of my identity. It's just my role, so I don't want to optimize too much for that." Search, social and assistive text now lead with who he is: a product leader who led payments at YouTube and builds Abacus Labs and suph.app.

| Where | Before | After |
|---|---|---|
| `HOME_DESCRIPTION` (→ meta, OG and Twitter descriptions, manifest, Person/WebSite/ProfilePage JSON-LD, the llms.txt summary) | Principal Product Manager at Steadily. Previously led payments at YouTube. Builds side projects with Abacus Labs and suph.app. (126 characters) | Product leader. Led payments at YouTube, 2020 – 2026. Builds Abacus Labs, a command center for MCA operators, and something new every month at suph.app. (152 characters) |
| `hero.srTitle` (the page's h1 once React renders; visually hidden) | Suphian Tweel. Principal product manager at Steadily. Previously led payments at YouTube. | Suphian Tweel. Product leader. Previously led payments at YouTube. Builds Abacus Labs and suph.app. |
| `HOME_TITLE` | Suphian Tweel · Product, Payments & AI | Unchanged: it already leads with the positioning and never named Steadily. |
| `site.title` (**proposal, pending Suphian's OK**; visible under his name in the no-JavaScript profile, and `humans.txt`) | Principal Product Manager, Steadily | Product leader. Led payments at YouTube; builds Abacus Labs and suph.app. |

- Facts only. "A command center for MCA operators" is the Abacus chapter's own wording, "every month" is suph.app's, and 2020 – 2026 is the YouTube chapter's years.
- No new AI claim. AI stays the site's positioning (title, edition, social card); the description names no AI work, so "no AI at YouTube" and its `content.test.mjs` guard still hold.
- Steadily is unchanged as a work chapter and stays the JSON-LD employer (`jobTitle`, `worksFor`), which is accurate. It no longer leads any summary.
- JSON-LD (not reader copy): the Person gains `affiliation` Abacus Labs (no founder, owner or employer claim); Person and WebSite `url` are now the canonical `https://suphian.com/`; the ProfilePage gains `dateModified`, the same date as the sitemap `<lastmod>` (`seo.lastModified`).

## Story index, facts and cleanup (2026-09-26)

Where the older sections below disagree, this one wins; they're kept as a record, with superseded "After" values corrected in place.

### The story index replaces About (01), Work (02) and Projects (03)

`src/content.js` → `story` (rendered by `src/story/`).

| Slot | Copy | Source |
|---|---|---|
| Heading | Good ideas deserve to get made. | Suphian's own words, used exactly (`story.heading`; the UI adds the red period). The earlier heading is retired. |
| Intro | I’m Suphian. I work in product and like turning ideas into things people can try, use, or enjoy. I care about how they work, how they look, and what happens when they meet the real world. In my free time I build cool stuff with Abacus Labs. | Suphian's own words, used exactly. `src/story/content.test.mjs` pins both. |
| List labels / close | Work / Side projects / Back | UI. "Work" and "Side projects" name the two lists; "Side projects" is also the divider between them. |
| Order | Steadily → YouTube → Google → Huge, then Abacus Labs → suph.app | Suphian: jobs first, newest to oldest, then his side projects at the bottom. |

Each chapter opens to its **role, years, a summary of the job and the original links**, in that order and nothing else (Suphian: "Role, year, and then just a summary of what the job was"). No extra headings, labels or slogans.

| Chapter | Role · years | Summary | Links |
|---|---|---|---|
| Steadily | Principal Product Manager · 2026 – Present | Steadily sells landlord insurance for rental property owners and investors. | Visit steadily.com |
| YouTube | Senior Product Manager · 2020 – 2026 | The old site's paragraph, verbatim except "an AI-powered payment system" → "a payment system". | Four of the five original links: Premium Lite, Shorts revenue sharing, Billboard, $6B. The machine-translation research link is out (see "No AI at YouTube"). |
| Google | Principal Analytical Lead · 2018 – 2020 | The old site's paragraph, verbatim. | Chewy IPO announcement, Duolingo Series D |
| Huge | Senior Product Analyst · 2014 – 2018 | The old site's paragraph, verbatim. | The four original links |
| *Side projects* | | | |
| Abacus Labs | **Side project** · Current | The old site's project description, verbatim ("Abacus turns spreadsheet chaos… I lead product and engineering."). | Visit abacuslabs.co |
| suph.app (new) | **Side project** · New build every month | Every month I make something. This month it’s The Toga Is Dead, a 3D board game you play in the browser: 2–4 players, with solo practice, same-screen play and online invitations, set in a medieval coastal kingdom or the Roman empire. | Play The Toga Is Dead (https://suph.app) |

- The summaries are the old site's paragraphs as one piece each. The "Work (02)" edit into summary + points below is superseded.
- **Side projects are marked as side projects** (Suphian: "indicate that these aren't my professional projects, but rather my side projects"). Abacus Labs and suph.app sit below the four jobs, under a quiet "Side projects" divider, and their line reads "Side project" where a job shows its title. In the data they carry `kind: 'side'`.
- Abacus Labs reads as his free-time project, matching the intro. The old tagline ("Operating system for Merchant Cash Advance") and tech stack aren't shown.
- suph.app is new (Suphian: "Every month I make something. Today's game is a board game. The game is called The Toga Is Dead."). Every fact in its summary is from his note or the game's README; its card is a screenshot of the game's welcome screen instead of a logo.
- Link labels are the ones in the "Work (02)" table below. Every href is unchanged.
- The company is "Huge" in the story (the old site said "Huge Inc"; the JSON-LD and llms files still say "Huge Inc").

### Removed (Suphian, 2026-09-26)

- **"Request resume"** beside the intro. Nothing opens the resume modal now; its files go in a later cleanup.
- **The contact form's "Request resume" chip** (Suphian: "Move the request resume"). The referral and job chips stay.
- **The podcast:** the /podcast page (the URL now redirects home), "Listen to the podcast", the `podcast` copy and `seo.podcast`, the sitemap entry, the manifest shortcut and `public/assets/audio/GenAI_Solves_YouTubes_20_Billion_Payment_Problem.m4a`. The resume audio stays.
- **Retired keys:** `about`, `work`, `projects`, `podcast`, `seo.podcast`, `contact.index`, `contact.kicker`, `contact.intro`, `contact.heading`, `contact.label` (the sheet no longer shows it), `story.ctas`, `notFound.video` (the 404's legacy logo video) and `common.scrollProgress` (nothing renders a progress bar).
- **Nav and cue:** `nav.links` About / Work / Projects → **Work** (`#work`, the story index), plus the Contact button. `hero.cueHref` `#about` → `#work`.

### No AI at YouTube (Suphian, 2026-09-26)

He did not do AI at YouTube, so every AI claim tied to YouTube is gone. The facts stay: $6B+ in music payments managed with compliance, execution of the payment system for launches including YouTube Shorts and YouTube Premium Lite, and the fraud detection initiative that surfaced a royalty scam (covered by Billboard). AI is mentioned only for Abacus Labs and Steadily. Kept: the header edition "Product / Payments / AI", and general AI skills that name no employer (`knowsAbout`, the FAQ expertise answer, the llms "AI & Machine Learning" lists).

| Where | After |
|---|---|
| `HOME_DESCRIPTION` (→ meta, OG and Twitter descriptions, manifest, Person JSON-LD) | Principal Product Manager at Steadily. Previously led payments at YouTube: $6B+ in music payments, Shorts monetization, and fraud detection. (140 characters) |
| `structuredData.website.description` | Personal site of Suphian Tweel, Principal Product Manager at Steadily. Previously payments at YouTube. |
| FAQ "Who is" | …and led a fraud detection initiative covered by Billboard. |
| FAQ "Experience" | …a Senior Product Manager at YouTube (2020–2026) leading payments, a Principal Analytical Lead… |
| FAQ "How has Suphian Tweel used AI to solve payment problems?" | **Removed.** |
| FAQ "Expertise" | …fintech, fraud detection, product management… |
| `knowsAbout` | "AI-Powered Fraud Detection" → "Fraud Detection" |
| Story, YouTube chapter | Led execution of a payment system for high-profile launches… |
| Story, YouTube links | "Google Research: zero-resource machine translation" **removed.** It's machine-learning research, and under YouTube it read as AI work there. **Needs your OK:** if it was real work of yours, tell me where it belongs and it comes back. |

Static files (mirrors of `content.js` where they overlap):
- **`index.html`:** the three descriptions, plus the Person, WebSite and FAQ JSON-LD (five entries), regenerated from `content.js`. The unchanged Organization block regenerates byte for byte, which checks the mapping.
- **`public/site.webmanifest`:** `description` as above. The Podcast shortcut is removed.
- **`public/sitemap.xml`:** caption "…Previously payments at YouTube". The /podcast entry is removed.
- **`public/llms.txt`:** tagline "…Previously led payments at YouTube."; About drops "and artificial intelligence", "AI-powered" and "AI-driven"; Expertise drops "ML-powered fraud detection"; the YouTube line is now "Senior Product Manager who led payments. Led execution of a payment system for YouTube Shorts and YouTube Premium Lite…" (the site's wording); Notable Work "Payment system for YouTube Shorts monetization", and "Zero-resource machine translation research (Google)" is removed (it came from the YouTube link above).
- **`public/llms-full.txt`:** tagline as above. About drops "and artificial intelligence", "AI-powered" and "in AI/ML". The AI & Machine Learning list drops its two YouTube lines (AI-powered fraud detection; machine learning for payment optimization) and "Zero-resource machine translation research". In Career, the YouTube paragraph is now the site's, and "AI-powered" and "using AI" are gone. Notable Projects: "AI-Powered Payment System (YouTube Shorts)" becomes "Payment System (YouTube Shorts)" without its machine-learning sentence. The fraud initiative loses "AI-driven" and its closing AI sentence. "Data analytics and AI" becomes "data analytics". In the FAQ, "Who is", "Products" and "Where" lose their YouTube AI wording, and the "used AI" entry is removed. FAQ "Expertise" no longer opens "an expert in payments and AI. At YouTube…": it's now "an expert in payments. At YouTube…", with the general skills list after it.

### Fonts and logos (dev, not copy)

- PP Neue Montreal: `src/fonts.css` (Regular, Italic, Semibold; `font-display: swap`), imported in `src/main.jsx`, with the Regular preloaded in `index.html` (its "No web fonts" comment is gone). The no-JS notice uses `var(--font-text…)` and the artwork red.
- `story.chapters[].image` is now `{ src, nudge }`. Each logo is centred on its card on both axes, in the rail and in the open view's panel. A wordmark with a descending "g" also gets a small optical nudge downward: Huge 0.026 and Google 0.018 of the logo's height. That puts the centre of mass of the letters above the baseline (the cap/x-height mass) on the card's centre, and the tail of the g hangs below. The values are measured from each SVG's paths (`src/story/logo-geometry.js`; `logo-geometry.test.mjs` fails if they drift). An earlier version centred the cap-to-baseline band instead (0.098 / 0.112), which sat both words visibly low. YouTube, Steadily and the Abacus mark have no descender, so no nudge.

- suph.app's card is a screenshot, not a logo (`imageFit: 'cover'`, `public/work/suph-app.webp`): it fills the card, anchored at its top, in the rail and in the open view, with no logo sizing and no nudge. Every other card keeps its white logo on the company color. Its color, the game's crown gold `#C19C56`, shows while the image loads and tints its marks.

### Questions for Suphian (new)

16. ~~Should the contact form's "Request resume" chip go too?~~ **Answered (2026-09-26): yes, removed.**
17. General AI skills stay in `knowsAbout`, the FAQ expertise answer and the llms files ("AI engineering", "machine learning"), because they name no employer. Keep them, or tie them to Abacus Labs?
18. ~~The Google Research zero-resource translation link under YouTube: keep, move or cut?~~ **Cut under "no AI at YouTube" (2026-09-26)**, from the story and the llms files. If it was real work of yours, say where it belongs and it comes back.
19. The search and AI-crawler text still puts Abacus Labs next to your jobs: the FAQ answers "Who is Suphian Tweel?" and "What is Suphian Tweel’s professional experience?" both say "He also leads product and engineering at Abacus Labs" (`content.js` → the `index.html` JSON-LD), and `llms.txt` / `llms-full.txt` list it under projects. Unchanged for now. Should they call it a side project too?
20. suph.app's summary names this month's build ("This month it’s The Toga Is Dead"), so it needs a one-line edit in `content.js` when the next one ships. suph.app isn't in the SEO or llms text. Should it be?

---

## Removed by Suphian (2026-09-26)

- **Typing hero:** the multilingual typing sentence (see the section below, kept as a record).
- **Space → pronunciation:** the Space hint, the "Hear how to say Suphian" button, the Space shortcut and the `.wav`. Space scrolls the page normally again.
- **Contact "Random quote" chip:** its label, author and every quote. The referral and job chips stay (the resume chip was removed later the same day; see the newest section).
- **Menu button:** the nav is an inline row at every width.
- **Abacus GitHub link:** the project links only to abacuslabs.co.

---

## Role update (2026-09-26)

Suphian's facts: Principal Product Manager at **Steadily** since July 2026. **YouTube** is now past (2020 – 2026). **Abacus Labs** is still current (he leads product and engineering; link is abacuslabs.co only). Google and Huge are unchanged. The only Steadily claims are the title, the company, the start date, what Steadily is (from steadily.com: "Landlord insurance for rental properties … for rental property owners and investors") and the link. No scope, team, metrics or launches.

**`src/content.js`**

| Key | Before | After |
|---|---|---|
| `HOME_TITLE` (→ `seo.home.title`, `seo.home.ogTitle`, `seo.manifest.name`) | Suphian Tweel · Senior Product Manager, YouTube | Suphian Tweel · Principal Product Manager, Steadily |
| `HOME_DESCRIPTION` (→ `site.description`, `seo.home.description`, `notFound.seo.description`, `seo.manifest.description`, `structuredData.person.description`) | Senior Product Manager at YouTube focused on payments…: $6B+ in music payments, YouTube Shorts monetization, and … fraud detection. | Principal Product Manager at Steadily. Previously led payments at YouTube: $6B+ in music payments, Shorts monetization, and fraud detection. (140 characters; AI wording removed 2026-09-26) |
| `site.title` | Senior Product Manager, YouTube | Principal Product Manager, Steadily |
| `hero.srTitle` | Suphian Tweel. Product manager at YouTube, leading payments. | Suphian Tweel. Principal product manager at Steadily. Previously led payments at YouTube. |
| `work.intro` | Payments at YouTube. / Growth analytics at Google. / Redesigns and testing at Huge. | **Product at Steadily.** / Payments at YouTube. / Growth analytics at Google. / Redesigns and testing at Huge. |
| `work.items[0]` (new) | none | Steadily · Principal Product Manager · 2026 – Present · "Steadily sells landlord insurance for rental property owners and investors." · link "Visit steadily.com" → https://steadily.com · no points |
| `work.items[1]` YouTube `period` / `end` | 2020 – Present / Present | 2020 – 2026 / 2026 |
| `structuredData.person.jobTitle` | Senior Product Manager | Principal Product Manager |
| `structuredData.person.worksFor` | YouTube, https://www.youtube.com | Steadily, https://steadily.com |
| `structuredData.person.alumniOf` | Google | YouTube, Google |
| `structuredData.website.description` | Personal site of Suphian Tweel, Senior Product Manager at YouTube focused on payments… | Personal site of Suphian Tweel, Principal Product Manager at Steadily. Previously payments at YouTube. (AI wording removed 2026-09-26) |
| FAQ "Who is" | Suphian Tweel is a Senior Product Manager at YouTube focused on payments… He has managed over $6 billion… | Suphian Tweel is a Principal Product Manager at Steadily, which sells landlord insurance for rental property owners and investors. He also leads product and engineering at Abacus Labs. Before Steadily he was a Senior Product Manager at YouTube (2020–2026), where he managed over $6 billion… (rest unchanged) |
| FAQ "Experience" | Suphian Tweel is a Senior Product Manager at YouTube (2020–Present) leading payments… Previously he was a Principal Analytical Lead… and a Senior Product Analyst… | Suphian Tweel has been a Principal Product Manager at Steadily since July 2026. Before that he was a Senior Product Manager at YouTube (2020–2026) leading payments, a Principal Analytical Lead at Google/CapitalG (2018–2020), and a Senior Product Analyst at Huge Inc (2014–2018). He also leads product and engineering at Abacus Labs. (AI wording removed 2026-09-26) |
| FAQ "AI" question and answer | (the AI-at-YouTube entry) | **Removed 2026-09-26:** no AI at YouTube. |
| FAQ "Location" | Suphian Tweel is based in San Francisco, California, where he works as a Senior Product Manager at YouTube. | Suphian Tweel is based in San Francisco, California. |

Checked and unchanged: the YouTube summary and points (already past tense: "Led", "Managed", "Optimized"), `about` (no role claims), `cvModal` and the resume episode title (the recording's name), the podcast copy, `hero.edition` (Product / Payments / AI), `work.heading`, `knowsAbout`, the Abacus project ("I lead product and engineering", still true).

**`public/site.webmanifest`** (static, not generated): `name` and `description` now match `HOME_TITLE` and `HOME_DESCRIPTION` above.

**`public/llms.txt`**
- Tagline: → "Principal Product Manager at Steadily. Previously led payments at YouTube." (AI wording removed 2026-09-26)
- About: present-tense YouTube paragraph → Steadily (joined July 2026, what Steadily sells), Abacus Labs (leads product and engineering), then YouTube 2020 to 2026 in the past tense.
- Experience: new **Steadily** (2026–Present) line; **YouTube** "(2020–Present): Senior Product Manager leading…" → "(2020–2026): Senior Product Manager who led…".
- New "Current Projects" section: Abacus Labs, linked to abacuslabs.co.

**`public/llms-full.txt`**
- Tagline: same as `llms.txt`.
- About, first paragraph: "is a Senior Product Manager at YouTube who specializes… He builds and ships…" → Steadily + Abacus first, then "From 2020 to 2026 he was a Senior Product Manager at YouTube, where he specialized… and built and shipped…".
- Career: new "### Steadily (2026–Present) — Principal Product Manager" entry; "### YouTube (2020–Present)" → "### YouTube (2020–2026)".
- Notable Projects: new "### Abacus Labs (current)" entry.
- FAQ "Who is": now Steadily + Abacus, then YouTube in the past tense.
- FAQ "Expertise": → "At YouTube he built solutions to…" (AI wording removed 2026-09-26).
- FAQ "AI": **removed 2026-09-26** (no AI at YouTube).
- FAQ "Products": Abacus Labs added first.
- FAQ "Where does Suphian Tweel work?": "a Senior Product Manager at YouTube… He has been at YouTube since 2020" → Steadily (since July 2026) + Abacus Labs, San Francisco, then YouTube 2020 to 2026.

**`public/humans.txt`**
- Added "Title: Principal Product Manager, Steadily".
- "Built with: React, TypeScript, Tailwind CSS, Supabase" → "Built with: React (JSX), plain CSS", plus "Contact form: Supabase" and "Hosting: Vercel".
- Last update: 2026/08/08 → 2026/09/26.

**`index.html`** (static mirror of `content.js`, not generated; the only copy of the Person, WebSite and FAQ JSON-LD that ships, since `useSeo` injects only the BreadcrumbList). Regenerated from `content.js` with the same field mapping; that mapping reproduces the previous head byte-for-byte from the previous `content.js`. Only these nine lines changed. The favicon links and everything else are untouched.
- `<title>`, `og:title`, `twitter:title`: Suphian Tweel · Senior Product Manager, YouTube → `HOME_TITLE`.
- `meta description`, `og:description`, `twitter:description`: the YouTube description → `HOME_DESCRIPTION` (157 characters).
- `#structured-data-person`: `jobTitle`, `worksFor` (Steadily, https://steadily.com), `description` and `alumniOf` (`[{Organization YouTube}, {Organization Google}]`), as in the `structuredData.person` rows above.
- `#structured-data-website`: `description`, as in the `structuredData.website.description` row above.
- `#structured-data-faq`: every entry matches `structuredData.faq`, including the "Who is", "Experience" and "Location" changes above (five entries since the "AI" entry was removed on 2026-09-26).

**`public/sitemap.xml`** (homepage entry only)
- `<image:title>`: Suphian Tweel · Senior Product Manager, YouTube → Suphian Tweel · Principal Product Manager, Steadily.
- `<image:caption>`: → Suphian Tweel, Principal Product Manager at Steadily. Previously payments at YouTube. (AI wording removed 2026-09-26)
- Homepage `<lastmod>`: 2026-08-08 → 2026-09-26. (The podcast entry was removed on 2026-09-26.)

---

## New-design slots (placeholders in `App.jsx`)

| Slot | Before | After | Why |
|---|---|---|---|
| Header edition | Creative / Design / Code | **Product / Payments / AI** | His title plus the two things every page says he works on (the SEO title reads "Payments & AI"). |
| Hero cue | Scroll / to compress | **Scroll / for the story** | Says what's below instead of what the animation does. Points at `#work`, the story index (was `#about` until 2026-09-26). |
| sr-only h1 | Suphian. Design & development. | **Suphian Tweel. Product manager at YouTube, leading payments.** | He's a PM, not a design studio. It matches the hero line. |
| Section top | Selected work · 01 / In progress | **Experience · 02 / Work** | Keeps his old "EXPERIENCE" heading as the kicker, and the index matches the nav. |
| Heading | Good things take shape. | **From analytics to payments.** | His actual path: Product Analyst, then Analytical Lead, then PM for payments. |
| Aside | A little room for what’s next. A selection of projects will live here. | **Payments at YouTube. Growth analytics at Google. Redesigns and testing at Huge.** | One line per job, all taken from the source. |
| Footer | Suphian © 2026 | **© {year} Suphian Tweel** | Full name, as on the live footer. The year is computed. |
| Skip link | Skip to content | Skip to main content | Wording from the live site. |
| Wordmark aria | SUPH — back to top | **Suphian Tweel, back to top** (`nav.home`) | Screen readers say "SUPH" as a word, not a name. I didn't edit `Wordmark.jsx`; wire this string in. |
| `index.html` | Suphian — Form & Motion / "An experiment in form and motion." | use `seo.home` | Placeholder. |

New headings for the other sections: **01** Story / About, *Wired for first principles.* (his own words) · **03** Current / Projects, *What I’m building.* · **04** Get in touch / Contact, *Say hello.*

Unchanged: "Back to top".

## Typing hero: removed (2026-09-26)

> **Suphian cut the multilingual typing sentence from the site.** Its strings (all 18 languages, the passion line and the screen-reader text) were removed from `content.js`, and the table below is kept only as a record. The page now goes straight from the wordmark hero to About. The **Space → pronunciation** feature stays, and its prompt now sits in the hero's bottom row.


| Before | After | Why |
|---|---|---|
| I’m passionate about crafting exceptional experiences powered by data, design, and cutting-edge tech. | **I build products with data, design, and AI.** | Cuts "passionate", "exceptional" and "cutting-edge", and says what he does. It drops from 101 to 43 characters, so the loop runs faster. AI is the tech the site names everywhere else. |
| JA: こんにちは、スフィアン。 | こんにちは、スフィアンです。 | The old line meant "Hello, Suphian" (greeting him) instead of "I'm Suphian". |
| KO: 안녕하세요, 수피안. | 안녕하세요, 수피안입니다. | Same problem. |
| Screen-reader text (hand-written copy) | Built from the English entry | It can't drift from the visible copy. |
| Space button aria: Scroll to story section | Scroll to the About section | The section is now called About. |

Unchanged: the greeting and the description ("I’m a product manager at YouTube leading payments.", already tight), the other 16 greetings, all 17 descriptions, the language order and Arabic `rtl`. I added a `code` field (for the `lang` attribute) to each language.

## About (01)

> **Retired 2026-09-26:** About, Work and Projects are replaced by the story index (see the newest section). These three tables are kept as a record.

| Before | After | Why |
|---|---|---|
| Heading: STORY (the nav said "About") | Kicker "Story" · 01 / About · *Wired for first principles.* | The nav and heading disagreed. Now both words appear. |
| I grew up between cultures — the kind of upbringing that teaches you to listen deeply… want to do more than just ship — they want to shake things up. | I grew up between cultures. **That taught me** to listen deeply… want to do more than ship. They want to shake things up. | Makes it first person, splits the em-dash chains and cuts "just". |
| **I think** data science and AI aren’t just the future — they’re the foundation. | Data science and AI aren’t just the future. They’re the foundation. | Drops the hedge. The rest of the paragraph is unchanged. |
| My work spans e-commerce, consumer apps, and internal tools — often the kinds of products that challenge business-as-usual and deliver a smarter, more human way of doing things. What ties it all together is a singular goal: helping ambitious teams think bigger. | My work spans **payments**, e-commerce, consumer apps, and internal tools, often products that replace business as usual with something smarter and more human. One goal ties it together: help ambitious teams think bigger. | Adds payments, his current work (it's listed in `llms-full.txt`), and cuts "the kinds of" and "singular". |
| Technology is going to remake everything — faster than most are ready for. But with the right mindset… a future that’s big enough for everyone. | Technology will remake everything, faster than most people are ready for. With the right mindset and a bias for clarity, we can build a future big enough for everyone. | Shorter verbs. Cuts "But" and "that’s". |
| Request My Resume (desktop) / **Download CV** (mobile) | Request resume | The mobile label promised a download that doesn't exist. Now one label everywhere. |
| Notebook LLM Podcast / Listen | Listen to the podcast | Says what happens and avoids the misspelled product name (see Q8). |

## Work (02)

| Before | After | Why |
|---|---|---|
| YouTube: one paragraph with "high-profile launches", "Also led a major fraud detection initiative…" | Summary plus three points. Cuts "high-profile", "Also" and "major", and ends with "…royalty scam. Billboard covered it." | Easier to scan. No facts changed. |
| Google: Served as an in-house analytics advisor… optimization **strategies**… across **platforms** like Duolingo and Chewy.com. | In-house analytics advisor for… / Led incrementality testing and optimization… at **companies** like Duolingo and Chewy.com. | "Strategies" was filler, and these are companies, not platforms. |
| Huge: …multivariate testing **for high-impact brands**. Helped improve UX… Hulu, Apple and AMC Theaters. | …multivariate testing. / Helped improve UX… Hulu, Apple, and AMC Theaters. | Cuts filler. The next line names the brands. |
| Link: YouTube Shorts Updates | YouTube Shorts revenue sharing | Says what the post is (taken from its URL). |
| Link: Billboard: YouTube Fraud Detection | Billboard: YouTube royalty scam | Matches the article. |
| Link: Huge Inc: Google Work | Huge: work for Google | Reads as a phrase. |

Unchanged: companies, roles, dates and every href. The other link labels only changed to sentence case.

## Projects (03)

Unchanged: the Abacus Labs name, tagline, description (already tight), stack and both links.

## Resume modal

| Before | After | Why |
|---|---|---|
| Request My CV | Request my resume | Uses one term across the site: "resume" suits a US audience and matches the audio's title. |
| To request my CV, please use the "Get in Touch" form and mention you’d like to receive my resume. I’ll review your request and follow up by email. | Use the contact form and ask for my resume. I review each request and reply by email. | Half the length, same process. |
| Get in Touch / Listen to Resume (button and dialog title) | Get in touch / Listen to my resume | Grammar. |

Unchanged: the episode title and subtitle, and "Close".

## Contact

| Before | After | Why |
|---|---|---|
| Let’s discuss your project or just say hello. | Tell me about a project or a role, or just say hello. | Matches who actually writes in; the chips are referral, job and resume. |
| your.email@example.com | you@example.com | Shorter. |
| Phone Number (Optional) | Phone (optional) | Shorter. |
| We have a PM opening that seems aligned with your background. Are you open to chat? | We have a PM opening that fits your background. Open to a chat? | Tighter. |
| Could you please share your latest resume with me? Thank you! | Could you send me your latest resume? Thanks! | Tighter. (The chip was removed on 2026-09-26.) |
| Chip: Random | Random quote | Says what it does. **Dev:** `ContactForm` matches on the text "Random". |
| Alexandre Dumas, Count of Monte Cristo | Alexandre Dumas, **The** Count of Monte Cristo | The book's actual title. |
| Please enter a valid email / Invalid email format | Enter a valid email address, like name@example.com. | One error had two messages. The new one shows the format. |
| Please enter a valid phone number | Enter a valid phone number, like +1 555 123 4567. | Shows what a valid number looks like. |
| Message too long (max 2500 chars). | Message must be 2,500 characters or less. | Matches the other length messages. |
| Send Message / Sending... | Send message / Sending… | Case. |
| Message sent! / Thank you for your message. I’ll get back to you soon. | Message sent / Thanks. I’ll get back to you soon. | Tighter. |
| Too many submissions / Please wait before submitting again. | Too many messages / You can send 3 messages an hour. Try again later, or email me at suph.tweel@gmail.com. | States the limit (the 3-per-60-minute default in `useRateLimiting.ts`) and gives a way out. |
| Something went wrong / Please try again later. | Message not sent / Something went wrong. Try again, or email me at suph.tweel@gmail.com. | Says what failed and offers a fallback. |

Unchanged: the "Contact" title, the name field, the message placeholder "Hey, what’s up? Talk to me." (his voice), the referral chip, every quote (verbatim), the other length messages and the honeypot strings.

## Podcast, audio, 404

> **The podcast was removed on 2026-09-26** (page, copy, SEO, audio file; see the newest section), so its rows are gone from this table.

| Before | After | Why |
|---|---|---|
| Page Not Found · Suphian Tweel / Go Home | Page not found · … / Go home | Case. |

Unchanged: "This page doesn’t exist." and all audio player aria labels.

## Nav, footer, accessibility

| Before | After | Why |
|---|---|---|
| Main navigation | Main | Screen readers already say "navigation". |
| Logo alt: Suphian Tweel — home | Suphian Tweel, back to top | In the new design the logo scrolls to the top. |
| Footer aria: Email | Email Suphian (opens Gmail in a new tab) | Names the action and warns that it leaves the page. |
| Footer aria: LinkedIn / GitHub | Suphian’s LinkedIn profile (opens in a new tab) / GitHub likewise | Same reason. |
| (opens in new tab) | (opens in a new tab) | Grammar. |

Unchanged: About, Work, Projects, Contact, Menu, Social links, Close, Page scroll progress and Tech stack.

## SEO and structured data

| Before | After | Why |
|---|---|---|
| Description: three variants, up to 228 characters | One description, now `HOME_DESCRIPTION`: Principal Product Manager at Steadily. Previously led payments at YouTube: $6B+ in music payments, Shorts monetization, and fraud detection. (140 characters; updated 2026-09-26) | One version that fits Google's roughly 155-character snippet. |
| OG/Twitter title: Suphian Tweel – Senior Product Manager at YouTube \| Payments & AI **Expert** | Suphian Tweel · Senior Product Manager, YouTube | Same as the page title (SEOHead already overwrote it for JS clients). Drops the self-awarded "Expert". |
| OG/Twitter image alt: the title again | Illustration of an astronaut running past a red crescent moon on a black background. | Alt text should describe the image. |
| Site name: Suphian Tweel Portfolio | Suphian Tweel | It's his name. |
| Manifest name: Suphian Tweel – **Product Manager** at YouTube \| Payments & AI Expert | Suphian Tweel · Senior Product Manager, YouTube | The manifest was the only place that dropped "Senior". |
| WebSite description: Portfolio website of… specializing in… | Personal site of… focused on… | Tighter. |
| FAQ "Who is": a present-tense YouTube answer | Steadily and Abacus Labs first, then YouTube in the past tense: "…he managed…, launched…, and led a fraud detection initiative…" (no AI at YouTube, 2026-09-26) | Direct verbs, same facts. |
| FAQ "AI" | **Removed 2026-09-26:** no AI at YouTube. | |
| FAQ "Contact": You can reach Suphian Tweel via email at… | Email him at…, or connect on… | Tighter. |
| noscript: This application requires JavaScript to run. Please enable JavaScript in your browser. | This site needs JavaScript. Turn it on in your browser, or email suph.tweel@gmail.com. | It's a website, not an app, and the line now offers a fallback. |
| Error: Failed to load application / Reload Page | The site failed to load / Reload page | Plain wording. |

Unchanged: the home title, robots, the FAQ answers on experience, expertise and location, the Person and Organization fields, `knowsAbout` and the Twitter handle.

**Skipped:** the Activity / analytics panel (being removed), dev-only strings (the test-email button and its toasts, the STAGING badge), analytics event labels, the `keywords` meta tag (search engines ignore it), and `llms.txt` and `humans.txt` (not part of the UI).

---

## Questions for Suphian

1. ~~Are both roles current?~~ **Answered (2026-09-26): YouTube is past (2020 – 2026). Steadily is current (Principal Product Manager since July 2026). Abacus is current.** See "Role update (2026-09-26)".
2. ~~Hero passion line wording~~ **Moot: the typing hero was removed (2026-09-26).**
3. ~~About now lists "payments" first among the kinds of work. Is that OK?~~ **Moot: About was retired (2026-09-26).**
4. ~~The Google Research zero-resource translation link sits under YouTube. Keep it, move it or cut it?~~ **Cut 2026-09-26 (no AI at YouTube); see Q18.**
5. The **Duolingo Series D** link is from June 2015, three years before your 2018–2020 Google role, and `llms-full.txt` says "before its Series D". What's the connection?
6. The Huge **Google work** and **Canada Goose IPO** links aren't mentioned in the Huge copy, and the **Beats** case study is hosted on elephant.is, which is a different agency. Are these your work?
7. ~~The podcast's $20 billion figure vs. the $6 billion in the experience section~~ **Moot: the podcast was removed (2026-09-26).**
8. ~~"Notebook LLM" should be NotebookLM~~ **Moot: the podcast link was removed (2026-09-26).**
9. The experience section says "$6 billion in music payments" and the FAQ says "$6B+ in **annual** music payments". Is it annual?
10. "AMC Theaters": the brand spells it "Theatres". I kept your spelling.
11. **Twitter/X @suphian** is in the meta tags and JSON-LD but not in the footer. Is it still active?
12. ~~Footer Email: Gmail web compose or `mailto:`?~~ **Answered (2026-09-26): keep Gmail web compose.**
13. ~~Is github.com/Suphian/abacus public?~~ **Answered (2026-09-26): don't link GitHub for Abacus. The project links only to abacuslabs.co.** The GitHub link is removed from `projects.items[0].links`.
14. `llms.txt` and `llms-full.txt` claim more than the site does ("Built and shipped", "Launched YouTube Premium Lite", where the site says "Led execution of"). Should they match? (`llms.txt`'s YouTube line now uses the site's "Led execution of"; `llms-full.txt` still says "Built and shipped".)
15. ~~The resume audio's grand title~~ **Moot once the resume modal is removed: nothing opens it since 2026-09-26.** (The recording's own title credits it with AI at YouTube, one more reason to retire it.)

**Dev notes (not copy):**
- The name input has `maxLength={72}` but the schema allows 100, so "Name must be 100 characters or less" can never appear.
- `AudioPlayer` hard-codes the resume subtitle.
- The Random chip is matched by its text.
- ~~On /podcast, Back and Close both call `navigate(-1)`.~~ Moot: /podcast now redirects home.

## Translations to review

> **Moot:** the typing hero was removed, so none of these ship. They're kept for reference in case it comes back.

**All 17 passion lines are machine-updated. Native review recommended.** The JA and KO greetings were also machine-updated.

| Lang | New passion line |
|---|---|
| ES | Creo productos con datos, diseño e IA. |
| FR | Je conçois des produits avec les données, le design et l’IA. |
| AR (rtl) | أبني منتجات بالبيانات والتصميم والذكاء الاصطناعي. |
| IT | Creo prodotti con dati, design e IA. |
| PT | Crio produtos com dados, design e IA. |
| DE | Ich baue Produkte mit Daten, Design und KI. |
| JA | データ、デザイン、AIでプロダクトをつくっています。 |
| ZH | 我用数据、设计和AI打造产品。 |
| KO | 데이터, 디자인, AI로 제품을 만듭니다. |
| RU | Я создаю продукты с помощью данных, дизайна и ИИ. |
| HI | मैं डेटा, डिज़ाइन और AI से प्रोडक्ट बनाता हूँ। |
| TR | Veri, tasarım ve yapay zekâ ile ürünler geliştiriyorum. |
| NL | Ik bouw producten met data, design en AI. |
| SV | Jag bygger produkter med data, design och AI. |
| NO | Jeg bygger produkter med data, design og KI. |
| EL | Φτιάχνω προϊόντα με δεδομένα, σχεδιασμό και τεχνητή νοημοσύνη. |
| PL | Tworzę produkty w oparciu o dane, design i AI. |

I left the descriptions alone, but a native reviewer should look at these awkward ones:
- **ES and PT:** "liderando" copies the English "-ing". Better: "…en YouTube y lidero pagos".
- **RU:** "ведущий платежи". Better: "отвечаю за платежи".
- **NL:** "die betalingen leidt".
