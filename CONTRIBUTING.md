# Contributing Guidelines

## 🚀 Deployment Workflow

**CRITICAL: NEVER PUSH DIRECTLY TO `main` (PRODUCTION).**

All changes must follow this workflow:

1.  **Develop:** Create a feature branch or use the `staging` branch for development.
2.  **Staging:** Push changes to the `staging` branch first.
    *   This triggers a preview deployment on Vercel.
    *   Verify changes at the Staging URL (e.g., `https://suphian-com-git-staging-suphians.vercel.app`).
3.  **Production:** Only after verification, merge `staging` into `main` via a Pull Request.

## 🛑 Branch Protection

*   **`main`**: Production code only. Protected.
*   **`staging`**: Pre-production / Testing environment.

