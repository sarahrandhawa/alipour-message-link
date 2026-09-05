const {
  formatEmail
} = require('../assets/mailer.private');

describe('formatEmail', () => {
  test('formats an SMS message with the sender number', () => {
    const email = formatEmail({
      from: '+15555550123',
      body: 'Hello, doctor.',
      channel: 'SMS'
    });

    expect(email.subject).toBe(
      '[SMS] New message from +15555550123'
    );
    expect(email.text).toContain('Channel: SMS');
    expect(email.text).toContain('From: +15555550123');
    expect(email.text).toContain('Hello, doctor.');
  });

  test('formats a web message with a name and phone number', () => {
    const email = formatEmail({
      from: '+15555550456',
      name: 'Test User',
      body: 'Please contact me.',
      channel: 'WEB'
    });

    expect(email.subject).toBe(
      '[WEB] New message from Test User (+15555550456)'
    );
    expect(email.text).toContain(
      'From: Test User (+15555550456)'
    );
  });

  test('uses Web visitor when no name or phone is provided', () => {
    const email = formatEmail({
      body: 'Anonymous test message.',
      channel: 'WEB'
    });

    expect(email.subject).toBe(
      '[WEB] New message from Web visitor'
    );
    expect(email.text).toContain('From: Web visitor');
  });

  test('preserves newlines and emoji in the message body', () => {
    const body = 'First line\nSecond line\nThank you 😊';

    const email = formatEmail({
      from: '+15555550789',
      body,
      channel: 'SMS'
    });

    expect(email.text).toContain(body);
    expect(email.text.endsWith(body)).toBe(true);
  });
});
