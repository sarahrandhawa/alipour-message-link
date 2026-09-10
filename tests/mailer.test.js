const { formatEmail } =
  require('../assets/mailer.private');

describe('formatEmail', () => {

  test('formats an SMS message with the sender number in the body', () => {
    const email = formatEmail({
      from: '+15555550123',
      body: 'Test SMS message',
      channel: 'SMS'
    });

    expect(email.subject).toBe('New SMS Message');
    expect(email.text).toContain('Channel: SMS');
    expect(email.text).toContain('From: +15555550123');
    expect(email.text).toContain('Test SMS message');
  });

  test('formats a web message with a name and phone number in the body', () => {
    const email = formatEmail({
      from: '+15555550456',
      name: 'Test User',
      body: 'Test web message',
      channel: 'WEB'
    });

    expect(email.subject).toBe('New WEB Message');
    expect(email.text).toContain('Channel: WEB');
    expect(email.text).toContain(
      'From: Test User (+15555550456)'
    );
    expect(email.text).toContain('Test web message');
  });

  test('uses Web visitor when no name or phone is provided', () => {
    const email = formatEmail({
      from: '',
      body: 'Anonymous web message',
      channel: 'WEB'
    });

    expect(email.subject).toBe('New WEB Message');
    expect(email.text).toContain('From: Web visitor');
    expect(email.text).toContain('Anonymous web message');
  });

});