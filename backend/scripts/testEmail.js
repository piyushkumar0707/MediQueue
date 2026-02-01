import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

console.log('🔍 Environment Check:');
console.log(`   EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Not set'}`);
console.log(`   EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Not set'}`);
console.log('');

// Then import services that need env variables
import emailService from '../src/services/emailService.js';

// Initialize email service AFTER env is loaded
emailService.initialize();

async function testEmailService() {
  console.log('🧪 Testing Email Service...\n');

  // Test 1: Consent Request Email
  console.log('1️⃣ Testing Consent Request Email...');
  const consentEmail = emailService.consentRequestEmail(
    'John Doe',
    'Dr. Smith',
    'Access to medical records for consultation'
  );
  console.log('Subject:', consentEmail.subject);
  console.log('HTML length:', consentEmail.html.length, 'characters');
  console.log('✅ Consent email template generated\n');

  // Test 2: Emergency Access Email
  console.log('2️⃣ Testing Emergency Access Email...');
  const emergencyEmail = emailService.emergencyAccessEmail(
    'Jane Smith',
    'Dr. Johnson',
    'Cardiac Emergency',
    'City Hospital ER'
  );
  console.log('Subject:', emergencyEmail.subject);
  console.log('HTML length:', emergencyEmail.html.length, 'characters');
  console.log('✅ Emergency email template generated\n');

  // Test 3: Appointment Reminder Email
  console.log('3️⃣ Testing Appointment Reminder Email...');
  const reminderEmail = emailService.appointmentReminderEmail(
    'Bob Wilson',
    'Dr. Brown',
    new Date('2026-02-15'),
    '10:00 AM - 10:30 AM'
  );
  console.log('Subject:', reminderEmail.subject);
  console.log('HTML length:', reminderEmail.html.length, 'characters');
  console.log('✅ Appointment reminder template generated\n');

  // Test 4: Prescription Email
  console.log('4️⃣ Testing Prescription Email...');
  const prescriptionEmail = emailService.prescriptionEmail(
    'Alice Cooper',
    'Dr. Davis',
    'Common Cold',
    [
      { name: 'Paracetamol', dosage: '500mg', frequency: '3 times daily', duration: '5 days' },
      { name: 'Vitamin C', dosage: '1000mg', frequency: 'Once daily', duration: '7 days' }
    ]
  );
  console.log('Subject:', prescriptionEmail.subject);
  console.log('HTML length:', prescriptionEmail.html.length, 'characters');
  console.log('✅ Prescription email template generated\n');

  // Test 5: Send actual email (if EMAIL_USER is configured)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && 
      process.env.EMAIL_USER !== 'your-email@gmail.com') {
    console.log('5️⃣ Testing Email Sending...');
    console.log(`Sending test email to: ${process.env.EMAIL_USER}`);
    
    try {
      const result = await emailService.sendEmail(
        process.env.EMAIL_USER,
        '🧪 CareQueue Email Test',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
              <h1>🏥 CareQueue</h1>
            </div>
            <div style="background-color: #f9fafb; padding: 30px;">
              <h2>✅ Email Service Test Successful!</h2>
              <p>This is a test email from CareQueue's notification system.</p>
              <p><strong>Tested features:</strong></p>
              <ul>
                <li>✅ Consent Request Template</li>
                <li>✅ Emergency Access Template</li>
                <li>✅ Appointment Reminder Template</li>
                <li>✅ Prescription Template</li>
                <li>✅ Email Sending via NodeMailer</li>
              </ul>
              <p>If you received this email, the email service is working correctly! 🎉</p>
            </div>
            <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px;">
              <p>Test conducted at: ${new Date().toLocaleString()}</p>
              <p>&copy; ${new Date().getFullYear()} CareQueue. All rights reserved.</p>
            </div>
          </div>
        `,
        'This is a test email from CareQueue\'s notification system.'
      );

      if (result.success) {
        console.log(`✅ Email sent successfully! Message ID: ${result.messageId}\n`);
      } else {
        console.log(`❌ Email sending failed: ${result.error}\n`);
      }
    } catch (error) {
      console.error('❌ Error testing email sending:', error.message);
    }
  } else {
    console.log('5️⃣ Skipping email sending test (EMAIL_USER not configured)');
    console.log('   To test actual email sending, set EMAIL_USER and EMAIL_PASSWORD in .env file\n');
  }

  console.log('🎉 Email service tests completed!');
  console.log('\n📚 To configure email service for production:');
  console.log('   - Read backend/EMAIL_SETUP.md for detailed instructions');
  console.log('   - Set up App Password for Gmail (development)');
  console.log('   - Use SendGrid or AWS SES for production');
}

// Run tests
testEmailService()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
