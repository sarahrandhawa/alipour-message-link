
const { sendEmail } = require('../assets/mailer.private');

async function main() {
  try {
    await sendEmail(process.env, {
      from: '+15555550123',
      name: 'Test Patient',
      body: 'This is a synthetic TUMA Gmail API test message.',
      channel: 'TEST'
    });

    console.log('Gmail test sent successfully.');
  } catch (error) {
    console.error('Gmail test failed:', error.message);
    process.exit(1);
  }
}

main();
