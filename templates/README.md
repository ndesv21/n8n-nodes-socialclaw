# Workflow templates

Importable n8n workflows that use the `n8n-nodes-socialclaw` node.

| File | What it does |
|---|---|
| `01-schedule-post.json` | Manual trigger → schedule a post. The "hello world". |
| `02-rss-to-social.json` | Every 6h → read an RSS feed → auto-post new items. |
| `03-webhook-to-social.json` | POST to a webhook → schedule the post from the request body. |

## Use a template
1. In n8n: **Workflows → Import from File** → pick a JSON.
2. Open the **SocialClaw** node and select your **SocialClaw API** credential (the `REPLACE_WITH_CREDENTIAL_ID` placeholder is replaced automatically when you pick it).
3. Replace `REPLACE_WITH_ACCOUNT_ID` with an account ID from **Account → List**.
4. Run it.

## Publish them on n8n.io (distribution)
1. Build the workflow in your own n8n exactly as you want it shown.
2. Make sure no real secrets/IDs are baked in (use placeholders).
3. Go to **n8n.io → Creator dashboard → Submit a workflow/template**, paste the workflow, write a clear title + description targeting search (e.g. "Auto-post your blog's RSS to X and LinkedIn with AI"), tag it, and submit.
4. Templates that reference a community node are allowed and help drive installs.
