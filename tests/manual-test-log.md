# TUMA Manual Test Log

## Environment
- Environment: Development
- Backend: Twilio Serverless
- Email delivery: Gmail API / Google Workspace
- Frontend: Local development server
- Automated test suite: Jest

## Test Results

| ID | Test | Expected Result | Result |
|---|---|---|---|
| T01 | Submit valid web message | Email delivered with WEB channel | PASS |
| T02 | Submit web message with name and phone | Sender information included in email | PASS |
| T03 | Successful web submission | "Message sent." displayed and form resets | PASS |
| T04 | SMS sent to Twilio number | Email delivered with SMS channel | PASS |
| T05 | Mobile "Send a text" link | Native messaging application opens | PASS |
| T06 | Desktop view | SMS button hidden | PASS |
| T07 | Mobile view | SMS button displayed | PASS |
| T08 | Automated Jest test suite | All tests pass | PASS |
| T09 | SMS automatic confirmation | Confirmation SMS received | BLOCKED |
| T10 | Android SMS link | Native Android messaging app opens correctly | NOT YET TESTED |

## Known Limitation

T09 is blocked by the current development Twilio number's outbound
messaging configuration. Twilio requires completion of A2P registration
before outbound application-generated SMS can be enabled.

The inbound SMS -> email pipeline is operational and was tested
successfully.

A2P onboarding and organizational consent/privacy/terms requirements
must be completed before production outbound messaging is enabled.