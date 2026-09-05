const {
  sendEmail
} = require('../assets/mailer.private');

const requiredVariables = [
  'SENDGRID_API_KEY',
  'FROM_EMAIL',
  'DEST_EMAIL'
];

const missingVariables = requiredVariables.filter(
  variable => !process.env[variable]
);

if (missingVariables.length > 0) {
  console.error(
    `Missing environment variables: ${missingVariables.join(', ')}`
  );
  process.exit(1);
}

sendEmail(process.env, {
  from: 'browser-demo',
  name: 'Sarah',
  body: 'This is a development test from Alipour Message Link.',
  channel: 'WEB'
})
  .then(() => {
    console.log('Test email sent successfully.');
  })
  .catch(error => {
    console.error(
      'SendGrid error:',
      error.response?.body || error.message
    );
    process.exit(1);
  });
