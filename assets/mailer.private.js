const { JWT } = require('google-auth-library');

function formatEmail({ from, body, channel, name }) {
  const who = name
    ? `${name} (${from || 'no number'})`
    : (from || 'Web visitor');

  return {
    subject: `New ${channel} Message`,
    text:
`A new message was received.

Channel: ${channel}
From: ${who}

Message:
${body}`
  };
}

function encodeMessage({ from, to, subject, text }) {
  const mimeMessage = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    text
  ].join('\r\n');

  return Buffer
    .from(mimeMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function sendEmail(context, payload) {
  let clientEmail;
  let privateKey;

  if (typeof Runtime !== 'undefined') {
    const fs = require('fs');

    const credentialsPath =
      Runtime.getAssets()['/google-service-account.json'].path;

    const credentials = JSON.parse(
      fs.readFileSync(credentialsPath, 'utf8')
    );

    clientEmail = credentials.client_email;
    privateKey = credentials.private_key;
  } else {
    clientEmail = context.GOOGLE_CLIENT_EMAIL;
    privateKey = context.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
  }

  const auth = new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/gmail.send'
    ],
    subject: context.GOOGLE_IMPERSONATED_USER
  });

  const tokenResponse = await auth.getAccessToken();

  if (!tokenResponse.token) {
    throw new Error('Unable to obtain Google access token');
  }

  const { subject, text } = formatEmail(payload);

  const raw = encodeMessage({
    from: context.GOOGLE_IMPERSONATED_USER,
    to: context.EMAIL_TO,
    subject,
    text
  });

  const response = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenResponse.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      'Gmail send failed:',
      response.status,
      errorText.substring(0, 500)
    );

    throw new Error(
      `Gmail API returned ${response.status}`
    );
  }

  return { ok: true };
}

module.exports = {
  formatEmail,
  sendEmail
};
