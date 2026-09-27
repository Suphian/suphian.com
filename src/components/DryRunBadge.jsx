import React from 'react';
import { dev } from '../content.js';

/** Local only: the contact form logs instead of calling Supabase (see lib/backend.js). */
export default function DryRunBadge() {
  return <p className="dry-run">{dev.dryRun}</p>;
}
