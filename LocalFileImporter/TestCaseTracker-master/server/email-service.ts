
import nodemailer from 'nodemailer';
import { logger } from './logger';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'ramesharavindhkarthikeyan.qa@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password' // Use App Password for Gmail
      }
    });
  }

  async sendWelcomeEmail(userEmail: string, userName: string, tempPassword?: string) {
    try {
      const logoUrl = 'https://your-replit-app.replit.dev/images/logo.svg'; // Update with your actual domain
      
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to TestCaseTracker</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; }
            .logo { max-width: 150px; height: auto; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 10px; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .credentials { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoUrl}" alt="TestCaseTracker Logo" class="logo">
              <h1>Welcome to TestCaseTracker!</h1>
            </div>
            
            <div class="content">
              <h2>Hello ${userName},</h2>
              
              <p>Welcome to TestCaseTracker - your comprehensive test case management system! We're excited to have you on board.</p>
              
              <h3>What is TestCaseTracker?</h3>
              <p>TestCaseTracker is a powerful, all-in-one test management platform designed to streamline your testing processes. Here's what you can do:</p>
              
              <ul>
                <li><strong>Test Case Management:</strong> Create, organize, and execute test cases efficiently</li>
                <li><strong>Bug Tracking:</strong> Report, track, and manage bugs with detailed workflows</li>
                <li><strong>Project Organization:</strong> Manage multiple projects with team collaboration</li>
                <li><strong>GitHub Integration:</strong> Sync bugs directly with GitHub issues</li>
                <li><strong>Reporting & Analytics:</strong> Generate comprehensive test reports and insights</li>
                <li><strong>Document Management:</strong> Store and organize test documentation</li>
                <li><strong>Time Tracking:</strong> Track time spent on testing activities</li>
                <li><strong>Traceability Matrix:</strong> Ensure complete test coverage</li>
              </ul>

              ${tempPassword ? `
              <div class="credentials">
                <h3>Your Login Credentials:</h3>
                <p><strong>Email:</strong> ${userEmail}</p>
                <p><strong>Temporary Password:</strong> ${tempPassword}</p>
                <p><em>Please change your password after your first login for security.</em></p>
              </div>
              ` : ''}
              
              <h3>Getting Started:</h3>
              <ol>
                <li>Log in to your account using the button below</li>
                <li>Complete your profile setup</li>
                <li>Join or create your first project</li>
                <li>Start creating test cases and managing your testing workflow</li>
              </ol>
              
              <div style="text-align: center;">
                <a href="https://your-replit-app.replit.dev/login" class="button">Login to TestCaseTracker</a>
              </div>
              
              <h3>Need Help?</h3>
              <p>If you have any questions or need assistance getting started, please don't hesitate to reach out to our support team.</p>
              
              <p>Happy Testing!<br>
              The TestCaseTracker Team</p>
            </div>
            
            <div class="footer">
              <p>© 2024 TestCaseTracker. All rights reserved.</p>
              <p>This email was sent to ${userEmail}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: {
          name: 'TestCaseTracker',
          address: 'ramesharavindhkarthikeyan.qa@gmail.com'
        },
        to: userEmail,
        subject: 'Welcome to TestCaseTracker - Your Test Management Journey Begins!',
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent successfully to ${userEmail}`, { messageId: info.messageId });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified successfully');
      return true;
    } catch (error) {
      logger.error('Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
