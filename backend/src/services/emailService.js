import pkg from 'nodemailer';
const { createTransport } = pkg;
import { logger } from '../utils/logger.js';

class EmailService {
  constructor() {
    this.transporter = null;
    // Don't initialize in constructor - wait for init() call
  }

  initialize() {
    if (this.transporter) return; // Already initialized
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Check if email credentials are configured
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || 
          process.env.EMAIL_USER === 'your-email@gmail.com') {
        logger.warn('Email service not configured. Emails will not be sent.');
        return;
      }

      // Configure email service with explicit Gmail SMTP settings
      this.transporter = createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        tls: {
          rejectUnauthorized: true
        }
      });

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('Email service configuration error:', error);
          logger.info('💡 Make sure you:');
          logger.info('   1. Have 2FA enabled on your Gmail account');
          logger.info('   2. Created an App Password (not regular password)');
          logger.info('   3. Removed all spaces from the App Password');
        } else {
          logger.info('✅ Email service is ready to send messages');
        }
      });
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  async sendEmail(to, subject, html, text) {
    try {
      if (!this.transporter) {
        logger.warn('Email transporter not initialized. Email not sent.');
        return { success: false, message: 'Email service not configured' };
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || '"CareQueue" <noreply@carequeue.com>',
        to,
        subject,
        html,
        text: text || this.stripHtml(html)
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${to}: ${info.messageId}`);
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      return { success: false, error: error.message };
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>?/gm, '');
  }

  // Email Templates

  consentRequestEmail(patientName, doctorName, purpose) {
    const subject = 'Consent Request - CareQueue';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 30px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 CareQueue</h1>
          </div>
          <div class="content">
            <h2>Consent Request</h2>
            <p>Dear ${patientName},</p>
            <p>Dr. ${doctorName} has requested your consent to access your medical records for the following purpose:</p>
            <p><strong>${purpose}</strong></p>
            <p>Please log in to your CareQueue account to review and respond to this consent request.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/patient/consent" class="button">Review Consent Request</a>
            <p>If you did not expect this request, please contact our support team immediately.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from CareQueue. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} CareQueue. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return { subject, html };
  }

  emergencyAccessEmail(patientName, doctorName, emergencyType, location) {
    const subject = '🚨 Emergency Access Granted - CareQueue';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
          .alert { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
          .content { background-color: #f9fafb; padding: 30px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          .info-box { background-color: #e5e7eb; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Emergency Access Alert</h1>
          </div>
          <div class="content">
            <div class="alert">
              <strong>⚠️ Emergency Access Granted</strong>
              <p>This is an urgent notification regarding access to your medical records.</p>
            </div>
            <h2>Hello ${patientName},</h2>
            <p>Emergency access to your medical records has been granted due to a critical situation.</p>
            <div class="info-box">
              <strong>Access Details:</strong>
              <ul>
                <li><strong>Doctor:</strong> Dr. ${doctorName}</li>
                <li><strong>Emergency Type:</strong> ${emergencyType}</li>
                <li><strong>Location:</strong> ${location || 'Not specified'}</li>
                <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            <p>This access was granted to ensure you receive the best possible emergency care. An administrator will review this access request.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/patient/emergency-access" class="button">View Access Details</a>
            <p><strong>Questions or concerns?</strong> Contact our support team immediately at support@carequeue.com</p>
          </div>
          <div class="footer">
            <p>This is an urgent automated message from CareQueue.</p>
            <p>&copy; ${new Date().getFullYear()} CareQueue. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return { subject, html };
  }

  verificationEmail(userName, verificationUrl) {
    const subject = '✅ Verify Your Email — CareQueue';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 30px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>🏥 CareQueue</h1></div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Hi ${userName},</p>
            <p>Thank you for registering! Please click the button below to verify your email address. This link expires in 24 hours.</p>
            <a href="${verificationUrl}" class="button">Verify Email</a>
            <p>If you did not create an account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from CareQueue. Please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} CareQueue. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return { subject, html };
  }

  appointmentReminderEmail(patientName, doctorName, appointmentDate, timeSlot) {
    const subject = '📅 Appointment Reminder - CareQueue';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 30px; }
          .appointment-card { background-color: white; border: 2px solid #059669; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Appointment Reminder</h1>
          </div>
          <div class="content">
            <h2>Hello ${patientName},</h2>
            <p>This is a friendly reminder about your upcoming appointment:</p>
            <div class="appointment-card">
              <h3>📋 Appointment Details</h3>
              <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
              <p><strong>Date:</strong> ${new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Time:</strong> ${timeSlot}</p>
            </div>
            <p><strong>Please arrive 10 minutes early</strong> to complete any necessary check-in procedures.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/patient/appointments" class="button">View Appointment</a>
            <p>Need to reschedule? Log in to your CareQueue account to modify your appointment.</p>
          </div>
          <div class="footer">
            <p>This is an automated reminder from CareQueue.</p>
            <p>&copy; ${new Date().getFullYear()} CareQueue. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return { subject, html };
  }

  prescriptionEmail(patientName, doctorName, diagnosis, medicines) {
    const subject = '💊 New Prescription Available - CareQueue';
    const medicineList = medicines.map(med => 
      `<li><strong>${med.name}</strong> - ${med.dosage}, ${med.frequency}, ${med.duration}</li>`
    ).join('');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #7c3aed; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 30px; }
          .prescription-box { background-color: white; border: 2px solid #7c3aed; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .medicine-list { background-color: #faf5ff; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          .warning { background-color: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💊 New Prescription</h1>
          </div>
          <div class="content">
            <h2>Hello ${patientName},</h2>
            <p>Dr. ${doctorName} has created a new prescription for you.</p>
            <div class="prescription-box">
              <h3>📋 Prescription Details</h3>
              <p><strong>Diagnosis:</strong> ${diagnosis}</p>
              <div class="medicine-list">
                <strong>Prescribed Medicines:</strong>
                <ul>
                  ${medicineList}
                </ul>
              </div>
            </div>
            <div class="warning">
              ⚠️ <strong>Important:</strong> Please follow the dosage and frequency as prescribed. Do not share this medication with others.
            </div>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/patient/prescriptions" class="button">View Full Prescription</a>
            <p>If you have any questions about your prescription, please contact your doctor.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from CareQueue.</p>
            <p>&copy; ${new Date().getFullYear()} CareQueue. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return { subject, html };
  }

  appointmentCancelledEmail(patientName, doctorName, appointmentDate, timeSlot, reason) {
    const subject = '❌ Appointment Cancelled - CareQueue';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 30px; }
          .appointment-card { background-color: #fee2e2; border: 2px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Appointment Cancelled</h1>
          </div>
          <div class="content">
            <h2>Hello ${patientName},</h2>
            <p>Your appointment has been cancelled.</p>
            <div class="appointment-card">
              <h3>📋 Cancelled Appointment</h3>
              <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
              <p><strong>Date:</strong> ${new Date(appointmentDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${timeSlot}</p>
              <p><strong>Reason:</strong> ${reason}</p>
            </div>
            <p>Would you like to book a new appointment?</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/patient/appointments/book" class="button">Book New Appointment</a>
          </div>
          <div class="footer">
            <p>This is an automated message from CareQueue.</p>
            <p>&copy; ${new Date().getFullYear()} CareQueue. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return { subject, html };
  }

  appointmentBookedEmail(patientName, doctorName, appointmentDate, timeSlot, reasonForVisit) {
    const subject = '✅ Appointment Confirmed - CareQueue';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 30px; }
          .appointment-card { background-color: #d1fae5; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Appointment Confirmed</h1>
          </div>
          <div class="content">
            <h2>Hello ${patientName},</h2>
            <p>Your appointment has been successfully booked!</p>
            <div class="appointment-card">
              <h3>📋 Appointment Details</h3>
              <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
              <p><strong>Date:</strong> ${new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Time:</strong> ${timeSlot}</p>
              <p><strong>Reason:</strong> ${reasonForVisit}</p>
            </div>
            <p>We'll send you a reminder before your appointment.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/patient/appointments" class="button">View Appointment</a>
          </div>
          <div class="footer">
            <p>This is an automated confirmation from CareQueue.</p>
            <p>&copy; ${new Date().getFullYear()} CareQueue. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return { subject, html };
  }
}

export default new EmailService();
