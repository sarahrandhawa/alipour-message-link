exports.handler = async function (context, event, callback) {
  const { sendEmail } =
    require(Runtime.getAssets()['/mailer.js'].path);

  const twiml = new Twilio.twiml.MessagingResponse();

  try {
    const body = (event.Body || '').trim();

    if (!body) {
      twiml.message(
        'Your message was empty. Please try again.'
      );

      return callback(null, twiml);
    }

    await sendEmail(context, {
      from: event.From,
      body,
      channel: 'SMS'
    });

    if (context.AUTO_REPLY === 'true') {
      twiml.message(
        `Thanks, your message was delivered to ${context.DOCTOR_NAME}.`
      );
    }

    return callback(null, twiml);
  } catch (error) {
    console.error(error);

    twiml.message(
      'Sorry, something went wrong. Please try again later.'
    );

    return callback(null, twiml);
  }
};
