# Coolify Automatic CI/CD Pipeline

To ensure redeployments of your four applications happen automatically whenever you push code to the `main` branch, you have two options. You can use either one of them (or both, though using one is sufficient).

---

## Option 1: Native GitHub Webhooks (Recommended)
This approach sets up a direct webhook between your GitHub repository (`scholar_hub`) and your Coolify instance. When code is pushed to the `main` branch, GitHub sends a webhook request directly to Coolify, and Coolify triggers the redeployment.

### How to configure on GitHub:
1. Go to your repository on **GitHub** → **Settings** → **Webhooks** → **Add webhook**.
2. Create **4 webhooks** (one for each of the 4 applications) using the following credentials:

| Application | Payload URL | Content Type | Secret | Events |
| :--- | :--- | :--- | :--- | :--- |
| **ScholarSync** | `http://<your-coolify-host>:8000/webhooks/source/github/events/manual` | `application/json` | `YOUR_SCHOLAR_SYNC_WEBHOOK_SECRET` | Just the `push` event |
| **ScholarServer** | `http://<your-coolify-host>:8000/webhooks/source/github/events/manual` | `application/json` | `YOUR_SCHOLAR_SERVER_WEBHOOK_SECRET` | Just the `push` event |
| **ScholarSync Portal** | `http://<your-coolify-host>:8000/webhooks/source/github/events/manual` | `application/json` | `YOUR_SCHOLAR_SYNC_PORTAL_WEBHOOK_SECRET` | Just the `push` event |
| **ScholarTrack Portal** | `http://<your-coolify-host>:8000/webhooks/source/github/events/manual` | `application/json` | `YOUR_SCHOLAR_TRACK_PORTAL_WEBHOOK_SECRET` | Just the `push` event |

3. Ensure **Active** is checked.
4. If your Coolify is running on plain HTTP, make sure **SSL verification** is disabled.
5. Click **Add webhook**.

---

## Option 2: GitHub Actions Workflow
The workflow `.github/workflows/deploy-coolify.yml` is already fully configured in this repository to run on pushes to `main`. 

To make it function correctly, you only need to configure two **GitHub Secrets** in your repository:
1. Go to your repository on **GitHub** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
2. Add the following secrets:

| Secret Name | Value | Description |
| :--- | :--- | :--- |
| **`COOLIFY_BASE_URL`** | `http://<your-coolify-host>:8000` | The base URL of your Coolify instance |
| **`COOLIFY_TOKEN`** | `YOUR_COOLIFY_BEARER_TOKEN` | The API Token with deploy permissions |

Whenever you push to the `main` branch, the GitHub Action will run and call the Coolify API to trigger redeployments.
