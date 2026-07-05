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
| **ScholarSync** | `http://103.235.106.147:8000/webhooks/source/github/events/manual` | `application/json` | `xvPRjlQyTvcBFzO1BnXUdSTT5Zpjk9NSdmOQ0SOv` | Just the `push` event |
| **ScholarServer** | `http://103.235.106.147:8000/webhooks/source/github/events/manual` | `application/json` | `bK06E2skA4ABlnTaQ9kJ6XDPiYxyF3jW3SIPBeeA` | Just the `push` event |
| **ScholarSync Portal** | `http://103.235.106.147:8000/webhooks/source/github/events/manual` | `application/json` | `GRpCd5JRURXhlKtvaBrqbN7xyf5xiU8nl7PGjOM8` | Just the `push` event |
| **ScholarTrack Portal** | `http://103.235.106.147:8000/webhooks/source/github/events/manual` | `application/json` | `OhXdF3gPE3CZAe4lyaRAlulDN4ZmV4Cbkb8avt3t` | Just the `push` event |

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
| **`COOLIFY_BASE_URL`** | `http://103.235.106.147:8000` | The base URL of your Coolify instance |
| **`COOLIFY_TOKEN`** | `2|2iq9vP0PzkJqJXZhv95vFlJAP5A8qBErfdvn9C0q39bd8432` | The API Token with deploy permissions |

Whenever you push to the `main` branch, the GitHub Action will run and call the Coolify API to trigger redeployments.
