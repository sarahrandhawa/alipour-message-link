exports.handler = async function (context, event, callback) {
  const { sendEmail } =
    require(Runtime.getAssets()['/mailer.js'].path);

  const response = new Twilio.Response();

  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Content-Type', 'application/json');

  const body = (event.message || '').trim();
  const name = (event.name || '').trim().slice(0, 80);
  const phone = (event.phone || '').trim().slice(0, 20);

  if (event.website) {
    response.setStatusCode(200);
    response.setBody({ ok: true });
    return callback(null, response);
  }

  if (body.length < 2 || body.length > 500) {
    response.setStatusCode(400);
    response.setBody({
      ok: false,
      error: 'Message must be 2–500 characters.'
    });
    return callback(null, response);
  }

  try {
    await sendEmail(context, {
      from: phone,
      name,
      body,
      channel: 'WEB'
    });

    response.setStatusCode(200);
    response.setBody({ ok: true });
  } catch (error) {
    console.error(error);

    response.setStatusCode(500);
    response.setBody({
      ok: false,
      error: 'Delivery failed.'
    });
  }

  return callback(null, response);
};
