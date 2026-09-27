import fs from 'node:fs';
import { crawlerResources } from './seo.mjs';
import { seo } from '../src/content.js';

// Run after editing approved copy. Builds also generate the crawler resources;
// keeping public/ synchronized makes local development and source review honest.
for (const [name, contents] of Object.entries(crawlerResources())) {
  fs.writeFileSync(new URL(`../public/${name}`, import.meta.url), contents);
}
const manifestPath = new URL('../public/site.webmanifest', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.name = seo.manifest.name;
manifest.description = seo.manifest.description;
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
