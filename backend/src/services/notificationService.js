import { logger } from '../utils/logger.js';
import emailService from './emailService.js';

/**
 * Notification Service
 * Handles real-time Socket.io notifications and email sending
 */
class NotificationService {
  constructor() {
    this.io = null;
  }

  /**
   * Initialize Socket.io instance
   * Call this in server.js after Socket.io is created
   */
  setSocketIO(io) {
    this.io = io;
    logger.info('NotificationService: Socket.io initialized');
  }

  /**
   * Emit notification to specific user via Socket.io
   * @param {String} userId - User ID to send notification to
   * @param {Object} notification - Notification data
   */
  emitToUser(userId, notification) {
    if (!this.io) {
      logger.warn('NotificationService: Socket.io not initialized');
      return;
    }

    try {
      // Emit to user-specific room
      this.io.to(`user:${userId}`).emit('notification', {
        type: 'new_notification',
        data: notification,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Notification emitted to user ${userId}: ${notification.type}`);
    } catch (error) {
      logger.error(`Failed to emit notification to user ${userId}:`, error);
    }
  }

  /**
   * Emit notification to multiple users
   * @param {Array} userIds - Array of user IDs
   * @param {Object} notification - Notification data
   */
  emitToUsers(userIds, notification) {
    if (!userIds || userIds.length === 0) return;

    userIds.forEach(userId => {
      this.emitToUser(userId, notification);
    });
  }

  /**
   * Emit notification to specific role (admin, doctor, patient)
   * @param {String} role - User role
   * @param {Object} notification - Notification data
   */
  emitToRole(role, notification) {
    if (!this.io) {
      logger.warn('NotificationService: Socket.io not initialized');
      return;
    }

    try {
      this.io.to(`role:${role}`).emit('notification', {
        type: 'new_notification',
        data: notification,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Notification emitted to role ${role}: ${notification.type}`);
    } catch (error) {
      logger.error(`Failed to emit notification to role ${role}:`, error);
    }
  }

  /**
   * Emit unread count update to user
   * @param {String} userId - User ID
   * @param {Number} count - Unread count
   */
  emitUnreadCount(userId, count) {
    if (!this.io) return;

    try {
      this.io.to(`user:${userId}`).emit('notification', {
        type: 'unread_count_update',
        data: { unreadCount: count },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Failed to emit unread count to user ${userId}:`, error);
    }
  }

  /**
   * Send email notification
   * @param {Object} notification - Notification document with populated recipient and sender
   */
  async sendEmail(notification) {
    try {
      // Populate recipient to get email if not already populated
      if (!notification.recipient.email) {
        await notification.populate('recipient', 'email firstName lastName');
      }

      // Populate sender for email context
      if (notification.sender && !notification.sender.firstName) {
        await notification.populate('sender', 'firstName lastName');
      }

      const recipientEmail = notification.recipient.email;
      const recipientName = `${notification.recipient.firstName} ${notification.recipient.lastName}`;
      const senderName = notification.sender ? `${notification.sender.firstName} ${notification.sender.lastName}` : 'CareQueue';

      let emailTemplate = { subject: '', html: '' };

      // Select appropriate email template based on notification type
      switch (notification.type) {
        case 'consent_request':
          emailTemplate = emailService.consentRequestEmail(
            recipientName,
            senderName,
            notification.metadata?.purpose || 'Medical records access'
          );
          break;

        case 'emergency_access':
          emailTemplate = emailService.emergencyAccessEmail(
            recipientName,
            senderName,
            notification.metadata?.emergencyType || 'Emergency',
            notification.metadata?.location || 'Not specified'
          );
          break;

        case 'appointment_reminder':
          emailTemplate = emailService.appointmentReminderEmail(
            recipientName,
            senderName,
            notification.metadata?.appointmentDate,
            notification.metadata?.timeSlot
          );
          break;

        case 'appointment_booked':
          emailTemplate = emailService.appointmentBookedEmail(
            recipientName,
            senderName,
            notification.metadata?.appointmentDate,
            notification.metadata?.timeSlot,
            notification.metadata?.reasonForVisit || 'Consultation'
          );
          break;

        case 'appointment_cancelled':
          emailTemplate = emailService.appointmentCancelledEmail(
            recipientName,
            senderName,
            notification.metadata?.appointmentDate,
            notification.metadata?.timeSlot,
            notification.metadata?.reason || 'No reason provided'
          );
          break;

        case 'prescription_created':
          emailTemplate = emailService.prescriptionEmail(
            recipientName,
            senderName,
            notification.metadata?.diagnosis || 'Not specified',
            notification.metadata?.medicines || []
          );
          break;

        case 'queue_update':
        case 'queue_status':
          emailTemplate = {
            subject: '🔔 Your Turn - CareQueue',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
                  <h1>🏥 CareQueue</h1>
                </div>
                <div style="background-color: #f9fafb; padding: 30px;">
                  <div style="background-color: #d1fae5; border-left: 4px solid #059669; padding: 20px; margin: 20px 0;">
                    <h2 style="margin: 0; color: #059669;">🔔 Your Turn!</h2>
                  </div>
                  <h2>Hello ${recipientName},</h2>
                  <p style="font-size: 16px;">${notification.message}</p>
                  <p style="font-size: 16px;"><strong>Doctor:</strong> Dr. ${senderName}</p>
                  <p style="font-size: 14px; color: #6b7280;">Please proceed to the consultation room immediately.</p>
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}${notification.actionUrl}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Queue Status</a>
                </div>
                <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px;">
                  <p>&copy; ${new Date().getFullYear()} CareQueue. All rights reserved.</p>
                </div>
              </div>
            `
          };
          break;

        default:
          // Generic email template for other notification types
          emailTemplate = {
            subject: notification.title,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
                  <h1>CareQueue</h1>
                </div>
                <div style="background-color: #f9fafb; padding: 30px;">
                  <h2>${notification.title}</h2>
                  <p>${notification.message}</p>
                  ${notification.actionUrl ? `<a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}${notification.actionUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Details</a>` : ''}
                </div>
                <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px;">
                  <p>&copy; ${new Date().getFullYear()} CareQueue. All rights reserved.</p>
                </div>
              </div>
            `
          };
      }

      // Send email
      const result = await emailService.sendEmail(
        recipientEmail,
        emailTemplate.subject,
        emailTemplate.html
      );

      if (result.success) {
        logger.info(`Email sent for notification ${notification._id} to ${recipientEmail}`);
        // Update notification to mark email as sent
        notification.emailSent = true;
        await notification.save({ validateBeforeSave: false });
      } else {
        logger.error(`Failed to send email for notification ${notification._id}:`, result.error);
      }

      return result.success;
    } catch (error) {
      logger.error(`Error sending email for notification ${notification._id}:`, error);
      return false;
    }
  }

  /**
   * Send SMS notification (placeholder for future implementation)
   * @param {Object} notification - Notification data with recipient phone
   */
  async sendSMS(notification) {
    // TODO: Implement SMS sending with Twilio
    logger.info(`SMS notification queued: ${notification.type} to ${notification.recipient}`);
    
    // Future implementation:
    // - Use Twilio API
    // - Format SMS message (160 char limit)
    // - Handle SMS failures and retries
    
    return true;
  }

  /**
   * Send notification through all enabled channels
   * @param {Object} notification - Notification document from database
   */
  async sendNotification(notification) {
    const promises = [];

    // In-app notification via Socket.io
    if (notification.channels.inApp) {
      this.emitToUser(notification.recipient.toString(), notification);
    }

    // Email notification
    if (notification.channels.email && !notification.emailSent) {
      promises.push(this.sendEmail(notification));
    }

    // SMS notification
    if (notification.channels.sms && !notification.smsSent) {
      promises.push(this.sendSMS(notification));
    }

    // Wait for all channels to complete
    try {
      await Promise.all(promises);
    } catch (error) {
      logger.error('Failed to send notification through all channels:', error);
    }
  }

  /**
   * Create and send notification helper
   * @param {Object} data - Notification data
   * @param {Model} NotificationModel - Notification model
   */
  async createAndSend(data, NotificationModel) {
    try {
      // Create notification in database
      const notification = await NotificationModel.create(data);
      
      // Populate sender info
      await notification.populate('sender', 'firstName lastName role');

      // Send through all channels
      await this.sendNotification(notification);

      return notification;
    } catch (error) {
      logger.error('Failed to create and send notification:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new NotificationService();
