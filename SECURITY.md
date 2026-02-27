# Security Policy

## Scope

This policy covers the Serizawa Test web application and its public API.

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

If you discover a security issue — including but not limited to:
- Authentication bypass or privilege escalation (admin/critic role access)
- Exposed API keys or service credentials
- SQL injection or data exfiltration via Supabase queries
- Rate limit bypass allowing abuse of the Anthropic API
- Server-side request forgery via the analysis endpoint

Please report it privately. Contact: **security@japanifornia.com** *(or open a GitHub Security Advisory if the repo has that feature enabled)*.

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Your suggested fix (optional but appreciated)

## Response Time

We aim to acknowledge reports within **48 hours** and provide a resolution timeline within **7 days**.

## What's In Scope

| Target | In scope |
|---|---|
| `serizawa.japanifornia.com` (production) | Yes |
| `*.vercel.app` preview deployments | Yes |
| `/api/*` endpoints | Yes |
| Supabase RLS bypass | Yes |
| Rate limiting circumvention | Yes |
| `localhost` / local dev | No |

## What's Out of Scope

- Theoretical vulnerabilities without a working proof of concept
- Issues in third-party services (Supabase, Anthropic, Upstash, Vercel) — report those directly to the vendor
- Denial of service via bulk requests (we have rate limiting; extreme abuse → contact us)
- Issues requiring physical access to a device

## Disclosure

Once a fix is deployed, we'll acknowledge the report in the relevant `CHANGELOG.md` entry (with your permission) and optionally credit you in the README.

---

*Serizawa Test — Japanifornia*
