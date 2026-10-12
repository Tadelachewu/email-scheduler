import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import nodemailer from 'nodemailer';
import { EmailService } from './email.service.js';

describe('EmailService', () => {
  const sendMail = vi.fn();
  let emailService: EmailService;

  beforeEach(async () => {
    sendMail.mockReset();
    vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail,
    } as never);

    const env: Record<string, string> = {
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      SMTP_USER: 'sender@example.com',
      SMTP_PASS: 'secret',
      EMAIL_TO: 'recipient@example.com',
    };

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => env[key],
            getOrThrow: (key: string) => env[key],
          },
        },
      ],
    }).compile();

    emailService = app.get<EmailService>(EmailService);
  });

  it('should send the email to the configured recipient', async () => {
    sendMail.mockResolvedValue({ messageId: 'abc' });

    await emailService.sendScheduledEmail();

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'sender@example.com',
        to: 'recipient@example.com',
      }),
    );
  });

  it('should not throw when delivery fails', async () => {
    sendMail.mockRejectedValue(new Error('SMTP down'));

    await expect(emailService.sendScheduledEmail()).resolves.toBeUndefined();
  });
});
