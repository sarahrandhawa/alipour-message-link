# TUMA Setup Guide

This guide explains how to configure, test, and deploy the Twilio Unified Message App (TUMA) in a development environment.

## Prerequisites

Install:

- Node.js 22
- npm
- Twilio CLI
- Twilio Serverless CLI plugin
- Git

Accounts/services required:

- Twilio account
- SMS-capable Twilio phone number
- Google Workspace account
- Google Cloud project with the Gmail API enabled
- Google Cloud service account with Domain-Wide Delegation configured

## 1. Clone the Repository

```bash
git clone <repository-url>
cd alipour-message-link
npm install
```

## 2. Google Workspace / Gmail API Setup

TUMA uses the Gmail API rather than SMTP or SendGrid.

The Google integration uses:

- Google Workspace
- Gmail API
- Service account authentication
- Domain-Wide Delegation
- OAuth 2.0
- The least-privilege `gmail.send` scope

Enable the Gmail API in the Google Cloud project.

Create a service account for TUMA and enable Domain-Wide Delegation.

In the Google Workspace Admin Console, authorize the service account's OAuth Client ID for:

```text
https://www.googleapis.com/auth/gmail.send
```

Create a JSON key for the service account.

Never commit the downloaded service-account JSON file to Git.

## 3. Configure Local Environment Variables

Copy the environment template:

```bash
cp .env.example .env
```

Configure `.env`:

```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_NUMBER=

DOCTOR_NAME=
AUTO_REPLY=false

GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_IMPERSONATED_USER=
EMAIL_TO=
```

### Variables

- `TWILIO_ACCOUNT_SID` — Twilio account identifier
- `TWILIO_AUTH_TOKEN` — Twilio authentication credential
- `TWILIO_NUMBER` — Twilio SMS number
- `DOCTOR_NAME` — recipient name displayed by the application
- `AUTO_REPLY` — enables or disables SMS confirmation responses
- `GOOGLE_CLIENT_EMAIL` — Google service-account email used for local development
- `GOOGLE_PRIVATE_KEY` — Google service-account private key used for local development
- `GOOGLE_IMPERSONATED_USER` — authorized Google Workspace user used by Gmail API Domain-Wide Delegation
- `EMAIL_TO` — Google Workspace inbox that receives TUMA messages

The development environment currently uses:

```env
AUTO_REPLY=false
```

because outbound SMS may require additional Twilio messaging registration/configuration.

Do not commit `.env`.

## 4. Configure the Twilio Deployment Environment

Google service-account private keys are too large to be stored directly as a Twilio Serverless environment variable.

TUMA therefore uses a Twilio Private Asset for the service-account credential in the deployed environment.

Create:

```text
.env.twilio
```

with:

```env
TWILIO_NUMBER=
DOCTOR_NAME=
AUTO_REPLY=false
GOOGLE_IMPERSONATED_USER=
EMAIL_TO=
```

Do not include `GOOGLE_PRIVATE_KEY` in `.env.twilio`.

The service-account credential is deployed separately as:

```text
assets/google-service-account.private.json
```

This file must be ignored by Git.

The deployed Twilio Runtime exposes it internally as:

```text
Runtime.getAssets()['/google-service-account.json']
```

The shared mailer is also deployed as a Private Asset:

```text
Runtime.getAssets()['/mailer.js']
```

Verify sensitive local files are ignored:

```bash
git check-ignore -v .env
git check-ignore -v .env.twilio
git check-ignore -v assets/google-service-account.private.json
```

## 5. Run Automated Tests

From the project root:

```bash
npm test
```

All tests should pass before deployment.

## 6. Test Gmail Delivery Locally

A synthetic Gmail API test can be sent using:

```bash
node --env-file=.env scripts/send-test-email.js
```

Only synthetic/test information should be used during development until the organization's production security and HIPAA prerequisites have been completed.

## 7. Authenticate Twilio CLI

Check available profiles:

```bash
twilio profiles:list
```

Select the appropriate development/company profile:

```bash
twilio profiles:use <profile-name>
```

Never place Twilio credentials directly in source files.

## 8. Deploy the Backend

Deploy using the Twilio-specific environment file:

```bash
twilio serverless:deploy --env .env.twilio
```

Do not deploy using the local `.env`, because it contains the Google private key used for local testing.

The deployment should provide endpoints similar to:

```text
https://<domain>.twil.io/incoming-sms
https://<domain>.twil.io/web-message
```

It should also deploy the following Private Assets:

```text
Runtime.getAssets()['/mailer.js']
Runtime.getAssets()['/google-service-account.json']
```

The Google service-account credential must not be exposed as a public asset.

## 9. Configure Incoming SMS

In the Twilio Console:

1. Open the configured Twilio phone number.
2. Locate its Messaging configuration.
3. Set "A message comes in" to Webhook.
4. Enter the deployed `/incoming-sms` URL.
5. Select HTTP POST.
6. Save the configuration.

An incoming SMS follows:

```text
Patient SMS
    ↓
Twilio phone number
    ↓
/incoming-sms
    ↓
Shared private mailer
    ↓
Google OAuth 2.0 / Gmail API
    ↓
Google Workspace inbox
```

For production use, the inbound SMS Function should use the organization's approved Twilio security configuration, including appropriate webhook protection/validation.

## 10. Configure the Frontend

Open:

```text
web/app.js
```

Set `ENDPOINT` to the deployed `/web-message` endpoint.

Set `TWILIO_NUMBER` to the Twilio number used by the deployment.

Do not place authentication credentials, Google credentials, Twilio authentication tokens, or other secrets in frontend JavaScript.

The web-message flow is:

```text
Web form
    ↓
/web-message
    ↓
Shared private mailer
    ↓
Google OAuth 2.0 / Gmail API
    ↓
Google Workspace inbox
```

## 11. Run the Frontend Locally

```bash
cd web
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000
```

The web form should submit messages to `/web-message`.

On supported mobile devices, the "Send a text" button should open the native messaging application.

## 12. Manual Verification

Verify:

- Valid web message delivers an email through Gmail API
- Web success state appears
- Invalid web messages are rejected
- Honeypot submissions do not deliver email
- Incoming SMS delivers an email through Gmail API
- Mobile SMS link opens the native messaging application
- Desktop layout hides the SMS button
- Mobile layout displays the SMS button

See `tests/manual-test-log.md` for recorded results.

Use synthetic information for development testing.

## 13. Security Verification

Before deployment, verify:

```bash
git check-ignore -v .env
git check-ignore -v .env.twilio
git check-ignore -v assets/google-service-account.private.json

git ls-files .env
git ls-files .env.twilio
git ls-files assets/google-service-account.private.json

npm audit
```

The sensitive files should be ignored and untracked.

The repository must never contain:

- Google service-account private keys
- Twilio authentication tokens
- OAuth access tokens
- real patient messages or PHI used as test fixtures

Review `tests/security-test-log.md` for additional security tests and production considerations.

## Production / HIPAA Notes

The current repository represents a development implementation. Successful technical testing does not by itself establish HIPAA compliance.

Before enabling TUMA for PHI, the organization should:

- Use the organization's approved Twilio account and phone number
- Complete the applicable Twilio BAA/account requirements
- Use only the required HIPAA-eligible Twilio services and configurations
- Complete the applicable Google Workspace BAA requirements
- Use an approved Google Workspace mailbox
- Confirm Domain-Wide Delegation and least-privilege Gmail API scopes
- Protect the inbound SMS Function appropriately
- Validate Twilio webhook requests as required by the production architecture
- Avoid logging message bodies, phone numbers, access tokens, MIME content, or private keys
- Restrict production CORS to the approved frontend origin
- Evaluate rate limiting and abuse protection
- Establish approved logging and data-retention policies
- Complete applicable outbound SMS registration
- Establish the final SMS consent/opt-in process
- Publish approved Privacy Policy and Terms & Conditions
- Deploy the frontend to approved HTTPS hosting
- Verify iOS and Android behavior on physical devices
- Complete organizational security and privacy review

The application should continue using synthetic data until those organizational and contractual requirements have been confirmed.

## Troubleshooting

### SMS reaches email but no SMS confirmation is returned

Check:

- `AUTO_REPLY`
- Twilio outbound messaging capability
- number registration/compliance status
- Twilio Function logs

The development environment may receive inbound SMS successfully even when outbound confirmation messages are restricted.

### Web form does not deliver email

Check:

- `/web-message` endpoint in `web/app.js`
- `GOOGLE_IMPERSONATED_USER`
- `EMAIL_TO`
- Gmail API enablement
- Domain-Wide Delegation configuration
- authorized `gmail.send` scope
- Twilio Function logs
- browser developer console

### Gmail works locally but fails after Twilio deployment

Verify that:

```text
Runtime.getAssets()['/google-service-account.json']
```

exists as a Private Asset.

The deployed application reads the service-account JSON from this Private Asset rather than from `GOOGLE_PRIVATE_KEY`.

Also verify that `.env.twilio` contains:

```text
GOOGLE_IMPERSONATED_USER
EMAIL_TO
```

### Deployment fails because an environment variable is too large

Do not place the Google service-account private key in `.env.twilio`.

Deploy the credential as:

```text
assets/google-service-account.private.json
```

and access it through the Twilio Runtime Private Asset.

### Serverless deployment fails

Verify:

```bash
node --version
twilio --version
twilio plugins
twilio profiles:list
```

This project was developed against Node.js 22.