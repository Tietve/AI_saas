import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/env';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export class EmailService {
  private transporter: Transporter;

  constructor() {
    // Check if SMTP is configured
    if (!config.SMTP_USER || !config.SMTP_PASS) {
      console.warn('[EmailService] SMTP not configured. Emails will be logged only.');
      // Create test account for development
      this.createTestAccount();
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS
      }
    });

    // Verify connection
    this.verifyConnection();
  }

  private async createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('[EmailService] Using Ethereal test account:', testAccount.user);
    } catch (error) {
      console.error('[EmailService] Failed to create test account:', error);
    }
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('[EmailService] SMTP connection verified');
    } catch (error) {
      console.error('[EmailService] SMTP connection failed:', error);
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: options.from || config.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      });

      console.log('[EmailService] Email sent:', {
        messageId: info.messageId,
        to: options.to,
        subject: options.subject
      });

      // If using Ethereal, log preview URL
      if (config.NODE_ENV === 'development' && !config.SMTP_USER) {
        console.log('[EmailService] Preview URL:', nodemailer.getTestMessageUrl(info));
      }
    } catch (error) {
      console.error('[EmailService] Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verifyUrl = `${config.APP_URL}/auth/verify?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Xác thực email của bạn</h2>
        <p>Chào bạn,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản ${config.APP_NAME}. Vui lòng nhấn vào nút bên dưới để xác thực email của bạn:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}"
             style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Xác thực email
          </a>
        </div>
        <p>Hoặc copy link này vào trình duyệt:</p>
        <p style="color: #666; word-break: break-all;">${verifyUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          Link này sẽ hết hạn sau 24 giờ.<br>
          Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.
        </p>
      </div>
    `;

    await this.sendEmail({
      to,
      subject: `Xác thực email - ${config.APP_NAME}`,
      html
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetUrl = `${config.APP_URL}/auth/reset?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Đặt lại mật khẩu</h2>
        <p>Chào bạn,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản ${config.APP_NAME} của bạn.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #DC2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Đặt lại mật khẩu
          </a>
        </div>
        <p>Hoặc copy link này vào trình duyệt:</p>
        <p style="color: #666; word-break: break-all;">${resetUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          Link này sẽ hết hạn sau 1 giờ.<br>
          Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
        </p>
      </div>
    `;

    await this.sendEmail({
      to,
      subject: `Đặt lại mật khẩu - ${config.APP_NAME}`,
      html
    });
  }

  /**
   * Send welcome email (after verification)
   */
  async sendWelcomeEmail(to: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Chào mừng đến với ${config.APP_NAME}! 🎉</h2>
        <p>Chào bạn,</p>
        <p>Email của bạn đã được xác thực thành công. Bạn đã sẵn sàng để sử dụng ${config.APP_NAME}!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.APP_URL}/chat"
             style="background-color: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Bắt đầu chat
          </a>
        </div>
        <p>Cảm ơn bạn đã tham gia!</p>
      </div>
    `;

    await this.sendEmail({
      to,
      subject: `Chào mừng đến với ${config.APP_NAME}!`,
      html
    });
  }
}

export const emailService = new EmailService();
