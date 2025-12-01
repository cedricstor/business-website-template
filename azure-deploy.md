## Deploy to Azure Static Web Apps

Follow these steps to host this Vite/Tailwind site on Azure Static Web Apps with GitHub Actions.

### Prerequisites
- Azure subscription
- GitHub repo with this project pushed
- Node 18+ locally (for testing)

### 1) Local build (optional sanity check)
```bash
npm install
npm run build
```
Output goes to `dist/`.

### 2) Create Static Web App
In Azure Portal:
- Create resource → Static Web App.
- Select subscription/resource group, give it a name, choose a region.
- Deployment source: GitHub.
- Pick your repo and branch.
- Build presets:
  - App location: `/`
  - API location: (leave blank for now)
  - Output location: `dist`
- Finish; Azure will create a GitHub Actions workflow in your repo.

### 3) Workflow settings
The generated workflow typically installs dependencies and runs `npm run build`, publishing `dist`. If it doesn’t, set:
- App build command: `npm run build`
- App artifact/location: `dist`

### 4) Environment variables
If/when you add an upload API, set `VITE_API_BASE` in the Static Web App Configuration:
- In the Azure Portal → your Static Web App → Settings → Configuration → Add `VITE_API_BASE=https://your-api.example.com`
- Re-run the workflow (push/PR to the configured branch) to apply.

### 5) Custom domain
In the Static Web App → Custom domains → add your domain; Azure handles HTTPS certs.

### 6) Future API
If you add a backend (e.g., for uploads to OneDrive):
- Host it separately (Azure Functions/App Service) and set `VITE_API_BASE`.
- Enable CORS for your Static Web App domain on that API.

### Troubleshooting
- Build fails: check the Actions logs; ensure `npm install` and `npm run build` succeed locally.
- 404s on refresh: Static Web Apps handles SPA fallback automatically; ensure `dist` is the output.
- Env vars not applied: ensure they’re set in the Static Web App Configuration and redeploy.
