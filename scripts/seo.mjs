import { site, hero, story, seo, structuredData, footer } from '../src/content.js';

export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const canonical = `${seo.origin}/`;
const json = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

export function schemaGraph() {
  const person = structuredData.person;
  const organization = (org) => ({ '@type': 'Organization', ...org });
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person', '@id': `${canonical}#person`, ...person,
        worksFor: organization(person.worksFor),
        affiliation: person.affiliation.map(organization),
      },
      {
        '@type': 'WebSite', '@id': `${canonical}#website`, ...structuredData.website,
        author: { '@id': `${canonical}#person` },
      },
      {
        '@type': 'ProfilePage', '@id': `${canonical}#profile`, url: canonical,
        name: seo.home.title, description: seo.home.description, dateModified: seo.lastModified,
        mainEntity: { '@id': `${canonical}#person` },
        isPartOf: { '@id': `${canonical}#website` }, inLanguage: 'en-US',
      },
    ],
  };
}

export function renderSeoHead() {
  const meta = (name, value, property = false) =>
    `<meta ${property ? 'property' : 'name'}="${name}" content="${escapeHtml(value)}" />`;
  return [
    `<title>${escapeHtml(seo.home.title)}</title>`,
    meta('description', seo.home.description), meta('author', site.fullName), meta('robots', seo.robots),
    meta('og:type', seo.og.type, true), meta('og:site_name', seo.og.siteName, true),
    meta('og:title', seo.home.ogTitle, true), meta('og:description', seo.home.description, true),
    meta('og:url', canonical, true), meta('og:locale', seo.og.locale, true),
    meta('og:image', seo.og.image, true), meta('og:image:width', String(seo.og.imageWidth), true),
    meta('og:image:height', String(seo.og.imageHeight), true), meta('og:image:type', seo.og.image.endsWith('.png') ? 'image/png' : 'image/jpeg', true),
    meta('og:image:alt', seo.og.imageAlt, true),
    meta('profile:first_name', structuredData.person.givenName, true),
    meta('profile:last_name', structuredData.person.familyName, true),
    meta('twitter:card', seo.twitter.card), meta('twitter:title', seo.home.ogTitle),
    meta('twitter:description', seo.home.description), meta('twitter:image', seo.twitter.image),
    meta('twitter:image:alt', seo.twitter.imageAlt), meta('twitter:creator', seo.twitter.handle),
    `<link rel="canonical" href="${canonical}" />`,
    `<script id="structured-data-profile" type="application/ld+json">${json(schemaGraph())}</script>`,
  ].join('\n    ');
}

const linkHtml = ({ label, href }) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;

// Same approved copy as the React dialogs, available to every visitor in the
// initial response. There is no bot detection or alternate search-only content.
// createRoot replaces this readable document with the interactive presentation.
export function renderStaticProfile() {
  const groups = [
    [story.labels.list, story.chapters.filter((chapter) => chapter.kind !== 'side')],
    [story.labels.sideProjects, story.chapters.filter((chapter) => chapter.kind === 'side')],
  ];
  return `<main id="main" class="static-profile">
      <header><h1>${escapeHtml(site.fullName)}</h1><p>${escapeHtml(site.title)}</p><p>${escapeHtml(hero.edition.join(' / '))}</p></header>
      <section id="${story.id}" aria-labelledby="static-story-title">
        <h2 id="static-story-title">${escapeHtml(`${story.heading.join(' ')}.`)}</h2>
        <p>${escapeHtml(story.intro)}</p>
        ${groups.map(([label, chapters]) => `<section><h2>${escapeHtml(label)}</h2>${chapters.map((chapter) => `
          <article id="${escapeHtml(chapter.id)}">
            <h3>${escapeHtml(chapter.name)}</h3>
            <p>${escapeHtml(chapterMeta(chapter))}</p>
            <p>${escapeHtml(chapter.summary)}</p>
            <ul>${chapter.links.map((link) => `<li>${linkHtml(link)}</li>`).join('')}</ul>
          </article>`).join('')}</section>`).join('')}
      </section>
      <footer><h2>Contact</h2><p>${linkHtml(footer.email)}</p><ul>${footer.links.filter((link) => link.label !== 'Email').map((link) => `<li>${linkHtml(link)}</li>`).join('')}</ul></footer>
    </main>`;
}

// Role, years and, for jobs, the city (Suphian 2026-09-27), as the open card shows them.
function chapterMeta(chapter) {
  return [chapter.role, chapter.period, chapter.location].filter(Boolean).join(' · ');
}

export function renderSeoHtml(template) {
  return template.replace('<!-- seo:head -->', renderSeoHead()).replace('<!-- seo:profile -->', renderStaticProfile());
}

export function crawlerResources() {
  const linkLine = ({ label, href }) => `- [${label}](${href})`;
  const intro = `# ${site.fullName}\n\n> ${seo.home.description}\n\n${hero.edition.join(' / ')}\n\n${story.intro}\n`;
  const links = `\n## Contact and profiles\n\n- [Email ${site.email}](mailto:${site.email})\n- [LinkedIn](${site.social.linkedin})\n- [GitHub](${site.social.github})\n`;
  const chapters = story.chapters.map((chapter) =>
    `### ${chapter.name}\n\n${chapterMeta(chapter)}\n\n${chapter.summary}\n\n${chapter.links.map(linkLine).join('\n')}`,
  ).join('\n\n');
  return {
    'robots.txt': `# Public pages and assets are crawlable. Existing training-crawler access is unchanged.\nUser-agent: *\nAllow: /\n\n# OpenAI search discovery (independent of GPTBot training controls).\nUser-agent: OAI-SearchBot\nAllow: /\n\nSitemap: ${seo.origin}/sitemap.xml\n`,
    'llms.txt': `${intro}\n## Pages\n\n- [Portfolio](${canonical}): Work at Steadily, YouTube, Google and Huge; side projects at Abacus Labs and suph.app.\n- [Full text](${seo.origin}/llms-full.txt): The same approved work summaries and reference links.\n${links}`,
    'llms-full.txt': `${intro}\n## Work and side projects\n\n${chapters}\n${links}`,
    'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${canonical}</loc><lastmod>${seo.lastModified}</lastmod></url>\n</urlset>\n`,
    'humans.txt': `/* TEAM */\nName: ${site.fullName}\nTitle: ${site.title}\nContact: ${site.email}\n\n/* SITE */\nLanguage: English\nBuilt with: React, Vite, CSS\nHosting: Vercel\nContact form: Supabase\n`,
  };
}
