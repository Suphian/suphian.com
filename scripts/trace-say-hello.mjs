// Export public/contact/say-hello.svg from the traced geometry in
// src/sayhello/lettering.js (regenerate that with scripts/trace-say-hello.py).
import { writeFile } from 'node:fs/promises';
import { createSayHelloSvg } from '../src/sayhello/lettering.js';

const target = new URL('../public/contact/say-hello.svg', import.meta.url);
await writeFile(target, createSayHelloSvg({ idPrefix: 'contact-' }), 'utf8');
console.log('Exported public/contact/say-hello.svg');
