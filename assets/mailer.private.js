const sgMail = require('@sendgrid/mail');

function formatEmail({ from, body, channel, name }) {
  const who = name
    ? `${name} (${from || 'no number'})`
    : (from || 'Web visitor');

  return {
    subject: `[${channel}] New message from ${who}`,
    text:
`Channel: ${channel}
From: ${who}
Received: ${new Date().toISOString()}

${body}`
  };
}

async function sendEmail(context, payload) {
  sgMail.setApiKey(context.SENDGRID_API_KEY);

  const { subject, text } = formatEmail(payload);

  await sgMail.send({
    to: context.DEST_EMAIL,
    from: context.FROM_EMAIL,
    subject,
    text
  });
}

module.exports = { formatEmail, sendEmail };
