# Email Service Configuration

## Gmail Setup (Development)

1. **Enable 2-Factor Authentication**:
   - Go to Google Account Settings
   - Security > 2-Step Verification
   - Enable 2FA

2. **Create App Password**:
   - Go to Google Account Settings
   - Security > 2-Step Verification > App passwords
   - Select "Mail" and "Other" (custom name)
   - Copy the 16-character password

3. **Add to .env file**:
```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM="CareQueue <noreply@carequeue.com>"
FRONTEND_URL=http://localhost:5173
```

## Production Setup (SendGrid/AWS SES)

### Option 1: SendGrid
```env
SENDGRID_API_KEY=your-api-key
EMAIL_FROM="CareQueue <noreply@carequeue.com>"
FRONTEND_URL=https://your-production-domain.com
```

Update `emailService.js` transporter:
```javascript
this.transporter = nodemailer.createTransporter({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

### Option 2: AWS SES
```env
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
EMAIL_FROM="CareQueue <noreply@carequeue.com>"
FRONTEND_URL=https://your-production-domain.com
```

Update `emailService.js` transporter:
```javascript
this.transporter = nodemailer.createTransporter({
  SES: new AWS.SES({
    apiVersion: '2010-12-01',
    region: process.env.AWS_SES_REGION
  })
});
```

## Email Templates

The following email templates are available:

1. **Consent Request**: `consentRequestEmail()`
2. **Emergency Access Alert**: `emergencyAccessEmail()`
3. **Appointment Reminder**: `appointmentReminderEmail()`
4. **Appointment Booked**: `appointmentBookedEmail()`
5. **Appointment Cancelled**: `appointmentCancelledEmail()`
6. **Prescription**: `prescriptionEmail()`

## Testing Email Service

Run the test script:
```bash
node backend/scripts/testEmail.js
```

## Troubleshooting

### Gmail "Less secure app access" error
- Use App Password (not your account password)
- Make sure 2FA is enabled

### Emails going to spam
- Add SPF, DKIM, and DMARC records to your domain
- Use a verified domain email address
- Avoid spam trigger words

### Rate Limits
- Gmail: 500 emails/day (free), 2000/day (Google Workspace)
- SendGrid: 100/day (free), unlimited (paid)
- AWS SES: 200/day (free), pay-per-email after

## Email Queue (Future Enhancement)

For high-volume email sending, consider implementing a job queue:
- Bull (Redis-based)
- Bee-Queue
- AWS SQS

This prevents blocking API responses while emails are being sent.
