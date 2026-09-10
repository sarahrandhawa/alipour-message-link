jest.mock('../assets/mailer.private', () => ({
  sendEmail: jest.fn()
}));

const mailer = require('../assets/mailer.private');
const mailerPath = require.resolve(
  '../assets/mailer.private'
);

class MockResponse {
  constructor() {
    this.headers = {};
    this.statusCode = 200;
    this.body = null;
  }

  appendHeader(name, value) {
    this.headers[name] = value;
  }

  setStatusCode(statusCode) {
    this.statusCode = statusCode;
  }

  setBody(body) {
    this.body = body;
  }
}

global.Runtime = {
  getAssets: () => ({
    '/mailer.js': {
      path: mailerPath
    }
  })
};

global.Twilio = {
  Response: MockResponse
};

const { handler } = require('../functions/web-message');

function invokeWebMessage(event, context = {}) {
  return new Promise((resolve, reject) => {
    handler(context, event, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
}

describe('web-message handler', () => {
  beforeEach(() => {
    mailer.sendEmail.mockReset();
    mailer.sendEmail.mockResolvedValue();
  });

  test('sends a valid web message', async () => {
    const response = await invokeWebMessage({
      name: 'Sarah',
      phone: '+15555550123',
      message: 'This is a valid test message.',
      website: ''
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ ok: true });

    expect(mailer.sendEmail).toHaveBeenCalledTimes(1);
    expect(mailer.sendEmail).toHaveBeenCalledWith(
      {},
      {
        from: '+15555550123',
        name: 'Sarah',
        body: 'This is a valid test message.',
        channel: 'WEB'
      }
    );
  });

  test('rejects a one-character message', async () => {
    const response = await invokeWebMessage({
      message: 'a'
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      ok: false,
      error: 'Message must be 2–500 characters.'
    });
    expect(mailer.sendEmail).not.toHaveBeenCalled();
  });

  test('rejects a message longer than 500 characters', async () => {
    const response = await invokeWebMessage({
      message: 'a'.repeat(501)
    });

    expect(response.statusCode).toBe(400);
    expect(mailer.sendEmail).not.toHaveBeenCalled();
  });

  test('quietly ignores a filled honeypPot field', async () => {
    const response = await invokeWebMessage({
      name: 'Spam Bot',
      message: 'Spam message',
      website: 'https://spam.example'
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(mailer.sendEmail).not.toHaveBeenCalled();
  });

  test('returns 500 when email delivery fails', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mailer.sendEmail.mockRejectedValue(
      new Error('Email unavailable')
    );

    const response = await invokeWebMessage({
      message: 'Valid message'
    });

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      ok: false,
      error: 'Delivery failed.'
    });

    consoleError.mockRestore();
  });

  test('truncates names to 80 characters', async () => {
    const longName = 'S'.repeat(100);

    await invokeWebMessage({
      name: longName,
      message: 'Valid message'
    });

    expect(mailer.sendEmail).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        name: 'S'.repeat(80)
      })
    );
  });
});

class MockMessagingResponse {
  constructor() {
    this.messages = [];
  }

  message(text) {
    this.messages.push(text);
    return this;
  }
}

global.Twilio.twiml = {
  MessagingResponse: MockMessagingResponse
};

const {
  handler: incomingSmsHandler
} = require('../functions/incoming-sms');

function invokeIncomingSms(event, context = {}) {
  return new Promise((resolve, reject) => {
    incomingSmsHandler(
      context,
      event,
      (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      }
    );
  });
}

describe('incoming-sms handler', () => {
  beforeEach(() => {
    mailer.sendEmail.mockReset();
    mailer.sendEmail.mockResolvedValue();
  });

  test('emails a valid SMS and creates an auto-reply', async () => {
    const context = {
      AUTO_REPLY: 'true',
      DOCTOR_NAME: 'Dr. Alipour'
    };

    const response = await invokeIncomingSms(
      {
        From: '+15555550123',
        Body: 'Hello from the SMS test.'
      },
      context
    );

    expect(mailer.sendEmail).toHaveBeenCalledTimes(1);
    expect(mailer.sendEmail).toHaveBeenCalledWith(
      context,
      {
        from: '+15555550123',
        body: 'Hello from the SMS test.',
        channel: 'SMS'
      }
    );

    expect(response.messages).toEqual([
      'Thanks, your message was delivered to Dr. Alipour.'
    ]);
  });

  test('rejects an empty SMS without sending email', async () => {
    const response = await invokeIncomingSms({
      From: '+15555550123',
      Body: '   '
    });

    expect(mailer.sendEmail).not.toHaveBeenCalled();
    expect(response.messages).toEqual([
      'Your message was empty. Please try again.'
    ]);
  });

  test('returns an apology when email delivery fails', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mailer.sendEmail.mockRejectedValue(
      new Error('Email unavailable')
    );

    const response = await invokeIncomingSms({
      From: '+15555550123',
      Body: 'Please deliver this.'
    });

    expect(response.messages).toEqual([
      'Sorry, something went wrong. Please try again later.'
    ]);

    consoleSpy.mockRestore();
 });

test('does not create an auto-reply when disabled', async () => {
    const context = {
      AUTO_REPLY: 'false',
      DOCTOR_NAME: 'Dr. Alipour'
    };

    const response = await invokeIncomingSms(
      {
        From: '+15555550123',
        Body: 'No automatic reply, please.'
      },
      context
    );

    expect(mailer.sendEmail).toHaveBeenCalledTimes(1);
    expect(response.messages).toEqual([]);
  });
});
