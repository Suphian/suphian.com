// Entry point for `node --test tests/` (the npm test script). Node 22+ treats
// that argument as a file path rather than a directory to search, and resolves
// it to this index. It loads every *.test.mjs beside it into this process.
// Plain `node --test` (default patterns) runs those files directly and skips this one.
import { readdir } from 'node:fs/promises';

const here = new URL('./', import.meta.url);
const files = (await readdir(here)).filter((name) => name.endsWith('.test.mjs')).sort();
for (const name of files) await import(new URL(name, here));
