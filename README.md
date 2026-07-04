# Forkd 🍴

**Swipe together. Eat together.**

A couples restaurant-matching PWA. Swipe on cuisines, then on real nearby
restaurants — when you both swipe right, it's a match. No more "I don't know,
where do YOU want to eat?"

See `DESIGN.md` for the full product spec and implementation plan.

## Local development

```bash
cd frontend
npm install
npm run dev
```

With no `VITE_API_URL` set, the app runs entirely on a built-in mock API
(fixture restaurants, simulated matches) — no backend or API keys needed.

## Deploying (from anywhere, including mobile)

Deploys run via the **Deploy Forkd** GitHub Action
(`.github/workflows/deploy.yml`) — trigger it from the Actions tab on
github.com or the GitHub mobile app: **Actions → Deploy Forkd → Run
workflow**, pick `both`/`backend`/`frontend`. No laptop or CLI needed.

One-time setup before the first run (all doable from a phone browser):

1. **Google**: create a GCP project, enable **Places API (New)** and
   **Geocoding API**, create an API key, and set a $5 budget alert.
   Store it in AWS SSM Parameter Store as `/forkd/google-api-key`
   (String, SecureString not required — Lambda reads it via
   `resolve:ssm:`).
2. **AWS**: create an IAM user with programmatic access and permissions for
   CloudFormation, Lambda, API Gateway, DynamoDB, S3, CloudFront, and SSM
   read. Add its keys as GitHub repo secrets: `AWS_ACCESS_KEY_ID`,
   `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`.
3. Run the workflow. It tests, builds, and deploys the SAM backend, then
   builds the frontend against the live API URL and syncs it to
   S3/CloudFront. The job output prints the public PWA URL.

> This repo was pivoted from Showmance, a movie/TV matching app. Git history
> has the old product.
