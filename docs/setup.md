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
- SendGrid account
- Verified SendGrid sender

## 1. Clone the Repository

```bash
git clone <repository-url>
cd alipour-message-link
npm install
```

## 2. Configure Environment Variables

Copy the environment template:

```bash
cp .env.example .env
```

Configure the values in `.env`:

```env
ACCOUNT_SID=
AUTH_TOKEN=
TWILIO_NUMBER=
SENDGRID_API_KEY=
FROM_EMAIL=
DEST_EMAIL=
DOCTOR_NAME=
AUTO_REPLY=false
```

Do not commit `.env`.

### Variables

- `ACCOUNT_SID` — Twilio account identifier
- `AUTH_TOKEN` — Twilio authentication credential
- `TWILIO_NUMBER` — Twilio SMS number
- `SENDGRID_API_KEY` — SendGrid API key with required mail permissions
- `FROM_EMAIL` — verified SendGrid sender
- `DEST_EMAIL` — inbox that receives TUMA messages
- `DOCTOR_NAME` — recipient name displayed by the application
- `AUTO_REPLY` — enables/disables SMS confirmation responses

The development environment currently uses `AUTO_REPLY=false` because outbound messaging requires additional Twilio messaging configuration/registration.

## 3. Run Automated Tests

From the project root:

```bash
npm test
```

All tests should pass before deployment.

## 4. Authenticate Twilio CLI

Check available profiles:

```bash
twilio profiles:list
```

Select the appropriate development/company profile:

```bash
twilio profiles:use <profile-name>
```

Never place Twilio credentials directly in source files.

## 5. Deploy the Backend

From the project root:

```bash
twilio serverless:deploy --env .env
```

The deployment should provide endpoints similar to:

```text
https://<domain>.twil.io/incoming-sms
https://<domain>.twil.io/web-message
```

The deployment should also expose the mailer internally as a private asset:

```text
Runtime.getAssets()['/mailer.js']
```

## 6. Configure Incoming SMS

In the Twilio Console:

1. Open the configured Twilio phone number.
2. Locate its Messaging configuration.
3. Set "A message comes in" to Webhook.
4. Enter the deployed `/incoming-sms` URL.
5. Select HTTP POST.
6. Save the configuration.

An incoming SMS should now follow:

```text
SMS
 ↓
Twilio number
 ↓
/incoming-sms webhook
 ↓
shared mailer
 ↓
SendGrid
 ↓
destination inbox
```

## 7. Configure the Frontend

Open:

```text
web/app.js
```

Set `ENDPOINT` to the deployed `/web-message` endpoint.

Set `TWILIO_NUMBER` to the Twilio number used by the deployment.

Do not place authentication credentials in frontend JavaScript.

## 8. Run the Frontend Locally

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

## 9. Manual Verification

Verify:

- Valid web message delivers an email
- Web success state appears
- Invalid web messages are rejected
- Honeypot submissions do not deliver email
- Incoming SMS delivers an email
- Mobile SMS link opens the native messaging application
- Desktop layout hides the SMS button
- Mobile layout displays the SMS button

See `tests/manual-test-log.md` for recorded results.

## 10. Security Verification

Before deployment, verify:

```bash
git check-ignore -v .env
git ls-files .env
npm audit
```

`.env` should be ignored and untracked.

Review `tests/security-test-log.md` for additional security tests and production considerations.

## Production Notes

The current repository represents a development implementation.

Before production use:

- Deploy using the organization's Twilio account
- Configure the organization's approved Twilio number
- Replace development environment values
- Complete applicable outbound SMS registration
- Establish the final SMS consent/opt-in process
- Publish approved Privacy Policy and Terms & Conditions
- Restrict CORS to the production frontend
- Evaluate rate limiting and abuse protection
- Deploy the frontend to approved HTTPS hosting
- Verify both iOS and Android behavior on physical devices
- Review organizational logging and data-retention requirements

If TUMA will handle protected health information, the organization must complete the appropriate security, privacy, BAA, and HIPAA-eligible service configuration before enabling that use.

## Troubleshooting

### SMS reaches email but no SMS confirmation is returned

Check:

- `AUTO_REPLY`
- Twilio outbound messaging capability
- Number registration/compliance status
- Twilio Function logs

The development environment encountered this condition because outbound messaging was restricted pending Twilio messaging registration.

### Web form does not deliver email

Check:

- `/web-message` endpoint in `web/app.js`
- SendGrid API key
- verified `FROM_EMAIL`
- `DEST_EMAIL`
- Twilio Function logs
- browser developer console

### Serverless deployment fails

Verify:

```bash
node --version
twilio --version
twilio plugins
twilio profiles:list
```

This project was developed against Node.js 22.