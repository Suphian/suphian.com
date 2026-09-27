# Contributing

Use Node 24. Before pushing, run npm test and npm run e2e:prod. The browser suite mocks contact requests and tests the production build with the same CSP as Vercel. CI runs both suites on pull requests and main.

Push a branch for a protected Vercel preview. To run browser tests against it, set E2E_BASE_URL to the deployment origin and E2E_STORAGE_STATE to authenticated browser state if protected. Never disable deployment protection for tests.

The main branch is production. A merge deploys the Vite build to suphian.com. Restore the previous production deployment using vercel rollback <deployment-url> from a directory linked to suph/suphian.com; revert the Git commit as well to keep future deployments aligned.

Supabase functions deploy separately. After confirming the site's email-logo asset is live:

```sh
npx supabase functions deploy notify-contact-submit --project-ref ujughujunixnwlmtdsxd --use-api
```

Preserve JWT verification and existing secrets. A real contact test writes a row and sends notification/confirmation emails; use the owner's address and a clearly labeled test message. Verify both email IDs in the function response in addition to the UI success message.

Everything under public/ ships to the CDN. Keep license documents, original artwork, screenshots, and credentials outside it. Do not commit .env, .vercel, or authenticated browser state.
