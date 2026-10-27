# didread-fetch

The Cloudflare Worker that fetches web pages for Didread. Browsers won't let the app read most sites itself (CORS), so a shared or pasted link goes through here. It serves only Didread's own origins, passes the page through unchanged with a 5 MB cap, and keeps nothing: request logging is off in `wrangler.toml`. The article is picked out in the app, on the device.

## Setting it up

1. Create an API token in Cloudflare (My Profile → API Tokens → Create Token → the **Edit Cloudflare Workers** template).
2. In the GitHub repository, under Settings → Secrets and variables → Actions, add:
   - the secret `CLOUDFLARE_API_TOKEN`, with the token
   - the variable `CLOUDFLARE_ACCOUNT_ID`, with your Cloudflare account ID
3. Run the **Worker** workflow (Actions → Worker → Run workflow). It deploys `didread-fetch` and prints its address, such as `https://didread-fetch.<your-subdomain>.workers.dev/`.
4. The app is built with that address: it's the default in `.github/workflows/deploy.yml` (currently `https://didread-fetch.dj-3e1.workers.dev/`). A deploy under another account gets another subdomain, so set the variable `LINK_FETCHER_URL` to its address, then run **Deploy**.

A build without a fetcher address (such as `npm run build` locally) keeps saying links can't be opened yet.

To deploy by hand instead: `npx wrangler deploy` in this folder.
