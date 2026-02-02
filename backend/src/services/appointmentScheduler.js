import cron from 'node-cron';
import Appointment from '../models/Appointment.js';
import Notification from '../models/Notification.js';
import notificationService from './notificationService.js';
import { logger } from '../utils/logger.js';

/**
 * Appointment Reminder Scheduler
 * Sends reminders 24 hours and 1 hour before appointments
 */

// Send 24-hour reminders every hour at :00
export const schedule24HourReminders = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Running 24-hour appointment reminder check...');

      // Find appointments scheduled for 24 hours from now
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      // Get appointments between 23-25 hours from now (1-hour window)
      const startWindow = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const endWindow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      const appointments = await Appointment.find({
        appointmentDate: { $gte: startWindow, $lte: endWindow },
        status: { $in: ['scheduled', 'confirmed'] },
        reminderSent24h: { $ne: true } // Haven't sent reminder yet
      })
        .populate('patient', 'personalInfo email phoneNumber firstName lastName')
        .populate('doctor', 'personalInfo professionalInfo firstName lastName');

      logger.info(`Found ${appointments.length} appointments needing 24h reminders`);

      for (const appointment of appointments) {
        try {
          // Create notification
          await Notification.createNotification({
            recipient: appointment.patient._id,
            type: 'appointment_reminder',
            title: '📅 Appointment Tomorrow',
            message: `Reminder: You have an appointment with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName} tomorrow at ${appointment.timeSlot.startTime}. Department: ${appointment.doctor.professionalInfo?.specialization || 'General'}`,
            priority: 'medium',
            relatedEntity: {
              entityType: 'Appointment',
              entityId: appointment._id
            },
            actionUrl: '/patient/appointments',
            channels: {
              inApp: true,
              email: true,
              sms: true
            }
          });

          // Mark reminder as sent
          appointment.reminderSent24h = true;
          await appointment.save();

          logger.info(`24h reminder sent for appointment ${appointment._id}`);
        } catch (error) {
          logger.error(`Failed to send 24h reminder for appointment ${appointment._id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error in 24-hour reminder scheduler:', error);
    }
  });

  logger.info('24-hour appointment reminder scheduler started');
};

// Send 1-hour reminders every 10 minutes
export const schedule1HourReminders = () => {
  // Run every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    try {
      logger.info('Running 1-hour appointment reminder check...');

      const now = new Date();
      
      // Get appointments between 50-70 minutes from now (20-minute window)
      const startWindow = new Date(now.getTime() + 50 * 60 * 1000);
      const endWindow = new Date(now.getTime() + 70 * 60 * 1000);

      const appointments = await Appointment.find({
        appointmentDate: { $gte: startWindow, $lte: endWindow },
        status: { $in: ['scheduled', 'confirmed'] },
        reminderSent1h: { $ne: true } // Haven't sent reminder yet
      })
        .populate('patient', 'personalInfo email phoneNumber firstName lastName')
        .populate('doctor', 'personalInfo professionalInfo firstName lastName');

      logger.info(`Found ${appointments.length} appointments needing 1h reminders`);

      for (const appointment of appointments) {
        try {
          // Create notification
          await Notification.createNotification({
            recipient: appointment.patient._id,
            type: 'appointment_reminder',
            title: '⏰ Appointment in 1 Hour',
            message: `Your appointment with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName} is in 1 hour at ${appointment.timeSlot.startTime}. Please be on time!`,
            priority: 'high',
            relatedEntity: {
              entityType: 'Appointment',
              entityId: appointment._id
            },
            actionUrl: '/patient/appointments',
            channels: {
              inApp: true,
              email: false,
              sms: true // SMS for urgent reminder
            }
          });

          // Mark reminder as sent
          appointment.reminderSent1h = true;
          await appointment.save();

          logger.info(`1h reminder sent for appointment ${appointment._id}`);
        } catch (error) {
          logger.error(`Failed to send 1h reminder for appointment ${appointment._id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error in 1-hour reminder scheduler:', error);
    }
  });

  logger.info('1-hour appointment reminder scheduler started');
};

// Initialize all appointment schedulers
export const initializeAppointmentSchedulers = () => {
  schedule24HourReminders();
  schedule1HourReminders();
  logger.info('All appointment schedulers initialized');
};

export default {
  initializeAppointmentSchedulers,
  schedule24HourReminders,
  schedule1HourReminders
};
