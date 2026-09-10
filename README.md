# Twilio Unified Message App (TUMA)

TUMA is a lightweight messaging application that provides users with two ways to send a message through a unified delivery pipeline:

1. SMS through a Twilio phone number
2. A browser-based messaging form

Both channels route messages through Twilio Serverless Functions and deliver them to a configured Google Workspace inbox using the Gmail API.

## Purpose

The purpose of TUMA is to provide a simple, configurable messaging interface without requiring users to understand the underlying communication infrastructure.

A user can either:

- Open their native SMS application and send a text to the configured Twilio number
- Submit a message through the web interface

Both methods ultimately deliver the message to the same configured destination inbox.

The current implementation is a development and testing version.

## Framework

### Frontend

- HTML
- CSS
- Vanilla JavaScript

The frontend provides a responsive web form and, on mobile devices, a link that opens the device's native SMS application.

### Backend

- Node.js 22
- Twilio Serverless Functions
- Twilio Programmable Messaging
- Google Gmail API
- Google Workspace
- Google OAuth 2.0 / Domain-Wide Delegation

### Testing

- Jest
- Manual integration testing
- Security and validation testing

## Architecture

```text
                         TUMA

        ┌─────────────────────────────────┐
        │                                 │
        │              User               │
        │                                 │
        └───────────┬───────────┬─────────┘
                    │           │
                  SMS         Web Form
                    │           │
                    ▼           ▼
              Twilio Number   app.js
                    │           │
                 webhook     HTTP POST
                    │           │
                    ▼           ▼
              /incoming-sms  /web-message
                    │           │
                    └─────┬─────┘
                          │
                          ▼
                   Shared Mailer
                          │
                          ▼
                 Google OAuth 2.0
                          │
                          ▼
                     Gmail API
                          │
                          ▼
                Google Workspace
                       Inbox
```

The deployed mailer authenticates to Google using a service account stored as a Twilio Private Asset. Domain-Wide Delegation allows the service account to act as an authorized Google Workspace user with the limited `gmail.send` OAuth scope.

## Why Twilio?

Twilio was selected because it provides messaging and serverless backend infrastructure within the same platform.

For this implementation, Twilio provides:

- Programmable SMS handling
- Webhook integration for incoming messages
- Serverless Node.js Functions
- Environment-based configuration
- Private server-side assets
- Managed backend deployment
- A straightforward path from development to production infrastructure

Twilio also provides healthcare-related Business Associate Agreement (BAA) options and HIPAA-eligible services for qualifying configurations.

TUMA should not be considered HIPAA-ready solely because it uses Twilio. Any production deployment involving protected health information must use the organization's approved Twilio account, agreements, configuration, policies, and applicable HIPAA-eligible services.

Cost and production messaging requirements should be evaluated using the organization's final Twilio configuration and expected message volume.

## Why Google Workspace / Gmail API?

TUMA uses the Gmail API to deliver messages into an organizational Google Workspace inbox.

The integration uses:

- Google Workspace
- Gmail API
- OAuth 2.0
- Service account authentication
- Domain-Wide Delegation
- The least-privilege `gmail.send` OAuth scope
- A dedicated destination inbox

The deployed Google service-account credential is stored as a Twilio Private Asset rather than exposed in frontend code or stored directly in a Twilio environment variable.

Google Workspace Gmail can support HIPAA workloads when used within the applicable Google Workspace BAA and appropriate organizational configuration. This does not make the application HIPAA compliant automatically.

## Message Flows

### SMS

When a user sends an SMS to the configured Twilio number:

1. Twilio receives the message.
2. Twilio invokes the `/incoming-sms` webhook.
3. The Serverless Function validates the message.
4. The function passes the message to the shared private mailer.
5. The mailer authenticates through Google OAuth 2.0.
6. The Gmail API delivers the message to the configured Google Workspace inbox.
7. The application can optionally request an SMS confirmation response.

Inbound SMS-to-Gmail delivery has been successfully tested.

The optional outbound SMS confirmation is currently disabled in the development environment because outbound messaging requires additional Twilio messaging registration/configuration.

### Web

When a user submits the browser form:

1. `app.js` collects the form values.
2. The frontend sends a JSON POST request to `/web-message`.
3. The Serverless Function validates the request.
4. Bot submissions may be filtered using the honeypot field.
5. The function passes the valid message to the shared private mailer.
6. The mailer authenticates through Google OAuth 2.0.
7. The Gmail API delivers the message to the configured Google Workspace inbox.
8. The frontend displays the resulting success or error state.

Web-to-Gmail delivery has been successfully tested.

## Code Overview

### `web/index.html`

Defines the messaging interface, web form, mobile SMS link, honeypot field, and user notice.

### `web/styles.css`

Provides the responsive layout and controls mobile/desktop presentation.

### `web/app.js`

Handles frontend behavior including:

- Native SMS link generation
- iOS/Android SMS URL formatting
- Form data collection
- JSON API requests
- Loading state
- Success and error feedback

### `functions/incoming-sms.js`

Receives Twilio's incoming SMS webhook, validates the message, passes it to the mailer, and optionally generates a TwiML SMS confirmation.

### `functions/web-message.js`

Receives browser form submissions, performs server-side validation and honeypot filtering, and passes valid messages to the mailer.

### `assets/mailer.private.js`

Shared private server-side module responsible for:

- Formatting messages
- Authenticating to Google
- Requesting an OAuth access token
- Encoding the email as a Gmail-compatible MIME message
- Sending the message through the Gmail API

### `assets/google-service-account.private.json`

Local deployment copy of the Google service-account credential.

This file is excluded from Git and is deployed to Twilio as a Private Asset:

```text
Runtime.getAssets()['/google-service-account.json']
```

It must never be committed to the repository.

## Hosting

The development backend is deployed using Twilio Serverless.

The frontend is currently run locally for development/testing and has not yet been deployed as the final public TUMA website.

A production deployment will require:

- Approved frontend hosting
- Production/company Twilio account and phone number
- Production environment configuration
- Appropriate messaging registration/configuration
- Final organizational privacy and terms documentation
- Final security and compliance review

## Configuration and Secrets

TUMA separates local development configuration from Twilio deployment configuration.

### Local Development

`.env` contains local configuration including:

- Twilio configuration
- Google service-account email
- Google private key
- Google Workspace impersonated user
- Destination inbox
- Application settings

`.env` is excluded from Git.

### Twilio Deployment

`.env.twilio` contains only the configuration required as Twilio environment variables, such as:

- Twilio number
- Displayed recipient name
- Auto-reply setting
- Google Workspace impersonated user
- Destination inbox

The Google private key is **not** stored in the Twilio deployment environment.

Instead, the service-account JSON is deployed as a Twilio Private Asset.

`.env.twilio` is also excluded from Git.

### Example Configuration

`.env.example` documents the required configuration using placeholders and contains no real credentials.

## Testing

Automated tests are implemented with Jest.

The automated test suite currently passes.

Manual and integration testing has verified major application flows including:

- Local Gmail API delivery
- Deployed web form to Gmail delivery
- Deployed SMS to Gmail delivery
- Web success state
- Mobile SMS-link visibility
- Desktop responsive behavior
- Input validation
- Honeypot behavior

Synthetic information is used for development testing.

See:

- `tests/manual-test-log.md`
- `tests/security-test-log.md`

## Security

The development implementation includes:

- Environment-based secret management
- Git exclusion of `.env`
- Git exclusion of `.env.twilio`
- Git exclusion of the Google service-account JSON
- Private Twilio mailer asset
- Private Google credential asset
- Google OAuth 2.0 authentication
- Domain-Wide Delegation
- Least-privilege `gmail.send` OAuth scope
- Server-side input validation
- Input length restrictions
- Honeypot bot mitigation
- Generic client-facing server errors
- Generic email subject lines that avoid placing sender identifiers in the subject
- Dependency vulnerability auditing
- Synthetic development test data

`npm audit` reported zero known vulnerabilities during the recorded security test.

### Production Security Work

Before public production deployment:

- Use the organization's approved Twilio account
- Complete applicable Twilio BAA/account requirements before handling PHI
- Complete applicable Google Workspace BAA requirements before handling PHI
- Confirm all services and configurations used for PHI are approved
- Protect the production inbound SMS Function appropriately
- Validate Twilio webhook requests as required
- Restrict CORS to the approved frontend origin
- Evaluate rate limiting and abuse protection
- Avoid logging message bodies, phone numbers, OAuth tokens, MIME content, or private keys
- Review logging and data-retention requirements
- Complete applicable SMS registration and consent requirements
- Use organization-approved Privacy Policy and Terms & Conditions
- Deploy the frontend to approved HTTPS hosting
- Complete final organizational security/privacy review

The current development interface explicitly instructs users not to submit medical or personal health information.

The application should continue using synthetic information until the required organizational, contractual, and technical safeguards are confirmed.

## Current Status

### Working

- Twilio Serverless backend deployment
- Incoming SMS webhook
- SMS-to-Gmail delivery
- Web-to-Gmail delivery
- Gmail API integration
- Google OAuth 2.0 authentication
- Google Workspace Domain-Wide Delegation
- Private Google credential asset
- Shared private mailer
- Responsive frontend
- Mobile native SMS link
- Web validation and honeypot handling
- Automated tests
- Manual integration tests
- Security testing

### Pending Production Configuration

- Company/production Twilio account configuration
- Production Twilio number
- Outbound SMS messaging registration/configuration
- Final public frontend hosting
- Production CORS restriction
- Rate limiting/abuse protection decision
- Production inbound webhook protection
- Final Privacy Policy and Terms & Conditions
- Final organizational consent flow
- Physical Android device verification
- Final Twilio BAA/HIPAA configuration if PHI will be handled
- Final Google Workspace BAA/configuration review if PHI will be handled
- Organizational security/privacy approval

## Future Expansions

TUMA can be extended to support:

- Secure web inbox
- Additional communication channels
- Message routing to different recipients or departments
- Administrative dashboard
- Message status and delivery tracking
- Approved persistent message storage
- Authentication and authorization
- Rate limiting and advanced abuse protection
- Monitoring and alerting
- Configurable automated responses
- Additional integrations with approved organizational systems

Any expansion involving sensitive or healthcare information should be reviewed against the organization's security, privacy, retention, and compliance requirements.

## Documentation

Additional project documentation is available in:

- `docs/setup.md` — development and deployment setup
- `docs/handoff.md` — production handoff and configuration
- `tests/manual-test-log.md` — manual test results
- `tests/security-test-log.md` — security test results