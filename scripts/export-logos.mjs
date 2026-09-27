import { mkdir, writeFile } from 'node:fs/promises';
import { createLogoSvg } from '../src/wordmark/lettering.js';

// Resolve from this script so the command also works outside the project root.
const outputDirectory = new URL('../public/logos/', import.meta.url);
await mkdir(outputDirectory, { recursive: true });

await Promise.all([
  writeFile(
    new URL('full-name.svg', outputDirectory),
    createLogoSvg({ idPrefix: 'full-' }),
    'utf8',
  ),
  writeFile(
    new URL('compact-logo.svg', outputDirectory),
    createLogoSvg({ compact: true, idPrefix: 'compact-' }),
    'utf8',
  ),
]);

console.log('Exported public/logos/full-name.svg and compact-logo.svg');
