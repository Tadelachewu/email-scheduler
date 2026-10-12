import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;

  constructor(private readonly config: ConfigService) {
    const port = Number(this.config.get('SMTP_PORT') ?? 587);

    this.transporter = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port,
      secure: port === 465,
      auth: {
        user: this.config.getOrThrow<string>('SMTP_USER'),
        pass: this.config.getOrThrow<string>('SMTP_PASS'),
      },
    });
  }

  @Cron('0 15,30 * * * *', {
    name: 'scheduled-email',
    waitForCompletion: true,
  })
  async sendScheduledEmail() {
    try {
      const info = await this.transporter.sendMail({
        from: this.config.getOrThrow<string>('SMTP_USER'),
        to: this.config.getOrThrow<string>('EMAIL_TO'),
        subject: 'Scheduled Email from NestJS',
        text: `Hello! This email was sent automatically at ${new Date().toISOString()}.`,
        html: '<h2>Hello!</h2><p>This email was sent automatically by NestJS Scheduler.</p>',
      });

      this.logger.log(`Email sent: ${info.messageId}`);
    } catch (error) {
      this.logger.error(
        'Email delivery failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
