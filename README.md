# Twilio Unified Message App (TUMA)

TUMA is a lightweight messaging application that provides users with two ways to send a message through a unified delivery pipeline:

1. SMS through a Twilio phone number
2. A browser-based messaging form

Both channels route messages through Twilio Serverless Functions and deliver them to a configured email inbox using SendGrid.

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

- Node.js
- Twilio Serverless Functions
- SendGrid
- Twilio Programmable Messaging

### Testing

- Jest
- Manual integration testing
- Security and validation testing

## Architecture

```text
                         TUMA

        ┌─────────────────────────────────┐
        │                                 │
        │           User                  │
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
                      SendGrid
                          │
                          ▼
                 Destination Inbox
```

## Why Twilio?

Twilio was selected because it provides messaging and serverless backend infrastructure within the same platform.

For this implementation, Twilio provides:

- Programmable SMS handling
- Webhook integration for incoming messages
- Serverless Node.js Functions
- Environment-based configuration
- Private server-side assets
- A straightforward path from development to a managed production deployment

Twilio also provides healthcare-related products and Business Associate Agreement (BAA) options for eligible configurations. TUMA should not be considered HIPAA-ready solely because it uses Twilio. Any production deployment involving protected health information must use the organization's approved configuration, agreements, policies, and HIPAA-eligible services.

Cost and production messaging requirements should be evaluated using the organization's final Twilio configuration and expected message volume.

## Message Flows

### SMS

When a user sends an SMS to the configured Twilio number:

1. Twilio receives the message.
2. Twilio invokes the `/incoming-sms` webhook.
3. The Serverless Function validates the message.
4. The function passes the message to the shared mailer.
5. SendGrid delivers the message to the configured destination inbox.
6. The application can optionally request an SMS confirmation response.

Inbound SMS-to-email delivery has been successfully tested.

The optional outbound SMS confirmation is currently limited by the development Twilio account's messaging registration status.

### Web

When a user submits the browser form:

1. `app.js` collects the form values.
2. The frontend sends a JSON POST request to `/web-message`.
3. The Serverless Function validates the request.
4. Bot submissions may be filtered using the honeypot field.
5. The function passes the valid message to the shared mailer.
6. SendGrid delivers the message to the configured destination inbox.
7. The frontend displays the resulting success or error state.

Web-to-email delivery has been successfully tested.

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

Shared private server-side module responsible for formatting messages and sending email through SendGrid.

## Hosting

The development backend is deployed using Twilio Serverless.

The frontend is currently run locally for development/testing and has not yet been deployed as the final public TUMA website.

A production deployment will require:

- Approved frontend hosting
- Production Twilio account and phone number
- Production environment variables
- Appropriate messaging registration/configuration
- Final organizational privacy and terms documentation

## Configuration and Secrets

Environment-specific values are provided through environment variables.

Examples include:

- Twilio account configuration
- Twilio phone number
- SendGrid API key
- Sender email
- Destination email
- Displayed doctor/recipient name
- Auto-reply setting

Local secrets are stored in `.env`, which is excluded from Git.

`.env.example` documents the required configuration without storing real credentials.

## Testing

Automated tests are implemented with Jest.

The automated test suite currently passes.

Manual testing has verified major application flows including:

- Web form to email
- SMS to email
- Web success state
- Mobile SMS-link visibility
- Desktop responsive behavior
- Input validation
- Honeypot behavior

See:

- `tests/manual-test-log.md`
- `tests/security-test-log.md`

## Security

The development implementation includes:

- Environment-based secret management
- Git exclusion of `.env`
- Private Twilio mailer asset
- Server-side input validation
- Input length restrictions
- Honeypot bot mitigation
- Generic client-facing server errors
- Dependency vulnerability auditing

`npm audit` reported zero known vulnerabilities during the recorded security test.

### Production Security Work

Before public production deployment:

- Restrict CORS to the approved frontend origin
- Evaluate rate limiting and abuse protection
- Complete applicable SMS registration and consent requirements
- Use organization-approved privacy and Terms & Conditions policies
- Review logging and data-retention requirements
- Complete required healthcare/HIPAA configuration before accepting PHI

The current development interface explicitly instructs users not to submit medical or personal health information.

## Current Status

### Working

- Twilio Serverless backend deployment
- Incoming SMS webhook
- SMS-to-email delivery
- Web-to-email delivery
- SendGrid integration
- Shared private mailer
- Responsive frontend
- Mobile native SMS link
- Web validation and honeypot handling
- Automated tests
- Manual integration tests
- Security testing

### Pending Production Configuration

- Company Twilio account migration
- Production Twilio number
- Outbound SMS messaging registration/configuration
- Final public frontend hosting
- Production privacy policy and Terms & Conditions
- Final organizational consent flow
- Physical Android device verification
- Production healthcare/BAA review if PHI will be handled

## Future Expansions

TUMA can be extended to support:

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