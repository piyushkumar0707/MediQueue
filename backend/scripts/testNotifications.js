import Notification from '../src/models/Notification.js';
import User from '../src/models/User.js';
import notificationService from '../src/services/notificationService.js';
import connectDB from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Test notification creation and real-time emission
 */
async function testNotifications() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Find a patient and doctor for testing
    const patient = await User.findOne({ role: 'patient' });
    const doctor = await User.findOne({ role: 'doctor' });

    if (!patient || !doctor) {
      console.error('Need at least one patient and one doctor in the database');
      process.exit(1);
    }

    console.log(`Found patient: ${patient.email}`);
    console.log(`Found doctor: ${doctor.email}`);

    // Test 1: Create appointment reminder notification
    console.log('\n1. Creating appointment reminder notification...');
    const appointmentNotification = await Notification.createNotification({
      recipient: patient._id,
      sender: doctor._id,
      type: 'appointment_reminder',
      title: 'Upcoming Appointment Reminder',
      message: 'You have an appointment with Dr. Smith tomorrow at 10:00 AM',
      priority: 'high',
      channels: {
        inApp: true,
        email: true,
        sms: false,
      },
      actionUrl: '/patient/appointments',
    });
    
    await appointmentNotification.populate('sender', 'personalInfo.firstName personalInfo.lastName role');
    console.log('✓ Notification created:', appointmentNotification._id);
    
    // Emit via Socket.io
    notificationService.emitToUser(patient._id.toString(), appointmentNotification);
    console.log('✓ Real-time notification sent to patient');

    // Test 2: Create consent request notification
    console.log('\n2. Creating consent request notification...');
    const consentNotification = await Notification.createNotification({
      recipient: patient._id,
      sender: doctor._id,
      type: 'consent_request',
      title: 'Consent Request',
      message: `Dr. ${doctor.personalInfo.firstName} ${doctor.personalInfo.lastName} is requesting access to your medical records`,
      priority: 'medium',
      channels: {
        inApp: true,
        email: true,
        sms: false,
      },
      actionUrl: '/patient/consent',
    });
    
    await consentNotification.populate('sender', 'personalInfo.firstName personalInfo.lastName role');
    console.log('✓ Notification created:', consentNotification._id);
    notificationService.emitToUser(patient._id.toString(), consentNotification);
    console.log('✓ Real-time notification sent to patient');

    // Test 3: Create emergency alert notification (urgent)
    console.log('\n3. Creating urgent emergency alert...');
    const emergencyNotification = await Notification.createNotification({
      recipient: patient._id,
      type: 'emergency_access',
      title: '🚨 Emergency Access Alert',
      message: 'A doctor has accessed your records under emergency circumstances',
      priority: 'urgent',
      channels: {
        inApp: true,
        email: true,
        sms: true,
      },
      actionUrl: '/patient/records',
    });
    
    console.log('✓ Notification created:', emergencyNotification._id);
    notificationService.emitToUser(patient._id.toString(), emergencyNotification);
    console.log('✓ Real-time notification sent to patient');

    // Test 4: Create system alert for doctor
    console.log('\n4. Creating system alert for doctor...');
    const systemNotification = await Notification.createNotification({
      recipient: doctor._id,
      type: 'system_alert',
      title: 'New Patient in Queue',
      message: '3 patients are waiting in the queue',
      priority: 'medium',
      channels: {
        inApp: true,
        email: false,
        sms: false,
      },
      actionUrl: '/doctor/queue',
    });
    
    console.log('✓ Notification created:', systemNotification._id);
    notificationService.emitToUser(doctor._id.toString(), systemNotification);
    console.log('✓ Real-time notification sent to doctor');

    // Get unread counts
    const patientUnreadCount = await Notification.getUnreadCount(patient._id);
    const doctorUnreadCount = await Notification.getUnreadCount(doctor._id);
    
    console.log('\n=== Unread Counts ===');
    console.log(`Patient (${patient.email}): ${patientUnreadCount} unread`);
    console.log(`Doctor (${doctor.email}): ${doctorUnreadCount} unread`);

    // Get notification statistics
    console.log('\n=== Testing Notification Queries ===');
    const patientNotifications = await Notification.getForUser(patient._id, {
      page: 1,
      limit: 10,
    });
    console.log(`Patient has ${patientNotifications.total} total notifications`);

    console.log('\n✅ All notification tests completed successfully!');
    console.log('\nNow test in browser:');
    console.log('1. Login as patient:', patient.email);
    console.log('2. Check notification bell for unread count');
    console.log('3. Click notification bell to see notifications');
    console.log('4. Click "View all notifications" to see full list');
    console.log('5. Mark notifications as read');

    process.exit(0);
  } catch (error) {
    console.error('Error testing notifications:', error);
    process.exit(1);
  }
}

// Run the test
testNotifications();
