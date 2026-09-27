// Entry point for `node --test src/sayhello/`. Node 22+ treats that argument as
// a file path rather than a directory to search, and resolves it to this index
// (same arrangement as tests/index.js). It loads every *.test.mjs beside it.
// Nothing in the app imports this file.
import { readdir } from 'node:fs/promises';

const here = new URL('./', import.meta.url);
const files = (await readdir(here)).filter((name) => name.endsWith('.test.mjs')).sort();
for (const name of files) await import(new URL(name, here));
