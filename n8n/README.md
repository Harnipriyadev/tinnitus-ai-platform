# Aurisense AI live automation

## Import

1. Open n8n and select **Workflows → Import from file**.
2. Import `workflows/aurisense-live-care-automation.json`.
3. In n8n, create a **Header Auth** credential:
   - Name: `X-Aurisense-Webhook-Key`
   - Value: the same long secret used for `N8N_WEBHOOK_SECRET` in the backend
4. Open the **Assessment Result Webhook** node and select that credential.
5. Activate the workflow and copy its production webhook URL.

## Backend environment variables

```env
N8N_WEBHOOK_URL=https://YOUR-N8N-HOST/webhook/aurisense-care-automation
N8N_WEBHOOK_SECRET=generate-a-long-random-secret
N8N_CALLBACK_SECRET=generate-a-different-long-random-secret
PUBLIC_BACKEND_URL=https://YOUR-BACKEND-HOST
```

`N8N_WEBHOOK_SECRET` must match the Header Auth credential in n8n.
The callback secret is supplied only in the secured HTTPS trigger and is used
by n8n when updating the live workflow status.

Generate secrets in PowerShell:

```powershell
[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLower()
```

## Live flow

After an assessment is saved, the backend sends only the workflow ID,
assessment ID, severity, risk and callback details to n8n. It does not send
the patient's name, email, password, token or full assessment answers.

n8n then updates these live stages:

1. Assessment received
2. Severity analysed
3. Personalised care plan created
4. Follow-up scheduled
5. Automation completed
