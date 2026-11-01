# OCHAYOLI — music label website

Website for Ochayoli and its O'Flow collective, live at https://ochayoli.in.
Source lives in `src/`; a build step produces the optimized tree that Hostinger serves.

## How a change reaches the live site

```text
edit src/  ──►  git push to main  ──►  GitHub Actions  ──►  `deploy` branch  ──►  Hostinger  ──►  ochayoli.in
                                        test + build +        (generated,         auto-deploy
                                        integrity check       never edit)         from branch
```

| Branch | Purpose | Who writes to it |
|---|---|---|
| `main` | Source of truth. Everything in `src/` plus tooling. | You, via pull request or direct push |
| `deploy` | The built site (`dist/`) and nothing else. | Only the workflow (or `npm run release`) |
| `feature/*`, `chore/*` | Work in progress. Open a PR into `main`; CI runs on it. | You |

Never edit `deploy` by hand and never edit files in Hostinger's file manager: the next deploy overwrites them.

## Repository map

```text
content/        site.json: releases, links, nav, events, contact topics (the one place content lives)
templates/      Shared head, header and footer, inserted into pages at build time
src/            The website as authored (pages hold markers such as <!--@include header-->)
  js/           Small ES modules (nav, releases, contact-form, reveal), bundled into script.js
  api/          PHP endpoints (disabled-by-default Qikink order boundary)
  lib/          PHP includes, blocked from direct web access
  fonts/        Self-hosted latin-subset fonts (SIL OFL 1.1, see fonts/LICENSES.txt)
design/         Editable design sources that are not deployed (og-poster.svg)
config/         Reference config for private values (never contains real secrets)
scripts/        build.mjs, check-dist.mjs, publish-deploy.sh, render-og.mjs
tests/          Smoke and contract tests
.github/        CI/CD workflow
```

## Commands

```text
npm ci            Install the build tooling (esbuild, sharp)
npm run dev       Build, then serve dist/ locally (static parts; PHP needs a PHP server)
npm test          Smoke, content-validation and Qikink contract tests
npm run build     Produce dist/ (minified, hashed, image-optimized)
npm run check     Fail if dist/ has a missing file, inline script, stray secret or indexable cart page
npm run verify    test + build + check
npm run release   verify, then publish dist/ to the deploy branch (same as CI does)
```

## Editing content

Releases, streaming and social links, nav items, events and contact topics live in `content/site.json`.
A link left empty is not rendered; an empty `events` list shows a "No dates yet" state; booking options live under `booking`. `npm test` rejects
non-https links, unknown hosts and duplicate ids. Shared header and footer live in `templates/`; page
title, description and robots are set by the `<!--@page ...-->` line at the top of each page.

## What the build does

- Renders pages: includes the shared templates, fills content blocks and `{{variables}}`.
- Bundles `src/script.js` and `src/js/*.js` into one hashed file.

- Minifies CSS and JS and renames them with a content hash, for example `styles.3fa91c0b2e.css`, so they can be cached for a year and still update instantly on deploy.
- Converts the hero image to AVIF and WebP in 640px and 1254px widths and serves them through `<picture>`.
- Rewrites every HTML reference to the hashed names.
- Leaves `.htaccess`, PHP, fonts and pages untouched.

`.htaccess` adds the HTTPS redirect, security headers (including a strict Content-Security-Policy), compression, caching rules and a custom 404. The policy allows same-origin resources only. Before adding any third-party embed (YouTube, Spotify, analytics), allow-list it in `src/.htaccess`.

## One-time setup

1. **GitHub to Hostinger:** connect GitHub once in hPanel (Websites → Git). This lets Hostinger read the repository.
2. **Point auto-deploy at the `deploy` branch:** repository `founderaethron-cloud/Ochayolioflow`, branch `deploy`, site type static, domain `ochayoli.in`.
3. **Workflow permissions:** Repository Settings → Actions → General → allow workflows to read and write (needed to update `deploy`).
4. **Private values stay out of Git.** Set `QIKINK_AUTH_TOKEN` and the live-order flags only in Hostinger environment variables or in `qikink-config.php` placed above `public_html`.

## Rollback

Every deploy is a commit on `deploy`. To roll back, revert the last commit on `main` and push (the workflow republishes), or revert the last commit on `deploy` directly in an emergency.

## Source and editorial guardrails

The existing O'Flow-derived repository copy is the source of truth for the collective, its artists, and the three track names. This site does not invent official artist photography, release artwork, streaming URLs, event dates, testimonials, or performance claims. Those items remain visibly marked as pending verification. The confirmed contact destination is `hello@ochayoli.in`.

The Store is intentionally a catalogue and availability-request experience until the label verifies products, authorised artwork, manufacturers, specifications, prices, stock, shipping rules, payment processing, and fulfilment. The product slots do not claim that official merchandise or physical releases currently exist.

### Qikink integration status

Qikink's documented custom-store flow uses its Open API order endpoint with an account auth token, Qikink SKU mappings, line-item prices, shipping details, and an order number. This repository includes a PHP adapter and dry-run validation, but no Qikink credential is stored or configured. Live supplier order creation requires `QIKINK_AUTH_TOKEN`, verified SKU mappings, and explicit enablement of both `OCHAYOLI_LIVE_ORDERS_ENABLED` and `OCHAYOLI_LIVE_PAYMENTS_ENABLED` outside GitHub. No supplier order is created by default.

There is no live payment webhook, order database, admin order-management surface, or automated fulfillment job enabled yet. Those are intentionally blocked until a payment provider, database target, Qikink account/API approval, SKU map, shipping/returns policy, and approval for non-dry-run ordering are supplied.

### Before launch, confirm

1. Artist names, biographies, spellings, credits, and approved imagery.
2. Official streaming links, release dates, and cover art.
3. Event details and the preferred contact destination.
4. Rights for music, photography, logos, and commissioned graphics.
5. Store inventory, product photography, prices, variant stock, fulfilment, return policy, shipping restrictions, and payment provider before activating purchases.
6. Qikink account access, API approval, SKU mappings, design URLs, sandbox instructions, and a non-paid test-order process before enabling fulfillment automation.

The inquiry form posts to `contact.php`, which checks the origin, applies a per-IP rate limit (5 per hour), validates server-side, and forwards messages to `hello@ochayoli.in` with a reference such as `OC-261101-A1B2C3`. The store pages keep their own head and menu for now.
