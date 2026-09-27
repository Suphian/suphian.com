// Test runner only, not app code: nothing imports this file.
// `node --test src/story/` (Node 22+) treats the directory argument as a file
// path and resolves it to this index, which loads every *.test.mjs beside it.
// Same pattern as tests/index.js.
import { readdir } from 'node:fs/promises';

const here = new URL('./', import.meta.url);
const files = (await readdir(here)).filter((name) => name.endsWith('.test.mjs')).sort();
for (const name of files) await import(new URL(name, here));
