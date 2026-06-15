# n8n-nodes-socialclaw

Community n8n node for [SocialClaw](https://getsocialclaw.com) — schedule & publish social posts to 11+ platforms (X, LinkedIn, Instagram, Facebook Pages, TikTok, YouTube, Reddit, Pinterest, WordPress, Discord, Telegram) from any n8n workflow.

## Operations

**Account**
- **List** — list connected social accounts (optional provider filter).
- **Get Capabilities** — media/text limits and publish rules for an account or provider.

**Post**
- **Schedule / Publish** — schedule (or immediately publish) a post through a connected account.
- **Validate** — check a post against provider rules before publishing.
- **List** — list posts.
- **Get** — fetch a single post.
- **Get Status** — delivery attempts/status for a post.
- **Cancel** — cancel or delete a scheduled post.
- **Get Analytics** — impressions/engagement for a post (windowed).

**Media**
- **Upload** — upload a binary file from a previous node; returns a hosted URL to use as **Media URL** on a post.

## Credentials

Create **SocialClaw API** credentials with your workspace **API key** (getsocialclaw.com → dashboard → Developers → Public API). The node sends `Authorization: Bearer <key>`. Click **Test** to verify the key against `/v1/accounts`.

## Quick start

1. **Account → List** to find an account ID.
2. **Post → Schedule / Publish**: set Account ID, Text, optional Publish At + Timezone. Leave Publish At empty to post now.
3. (Optional) **Media → Upload** first, then paste the returned URL into the post's **Media URL**.

## Develop & test locally

```bash
npm install
npm run build
# link into a local n8n install
cd ~/.n8n/custom && npm link n8n-nodes-socialclaw
# restart n8n, add SocialClaw API credentials, drop the node in a workflow
```

## Publish + get verified

1. `npm run lint` and `npm run build` must pass (they do).
2. Publish to npm: `npm publish` (you need `npm login`). For **verified** status on n8n Cloud, publish from GitHub Actions **with provenance** (`.github/workflows/release.yml` is set up for this) and submit in the **n8n Creator Portal**.
3. Then publish workflow **templates** on n8n.io that use the node — that's the real distribution.

## Notes

- No runtime dependencies (everything is `devDependencies` / `peerDependencies`) — required for verification.
- Package name starts with `n8n-nodes-` and TypeScript + the n8n lint config pass.
