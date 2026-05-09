# Email Service Configuration

This project uses a two-step delivery strategy:

1. Brevo SMTP via Nodemailer (primary)
2. Brevo Transactional API (automatic fallback when SMTP fails)

## Brevo Setup

1. Create a Brevo account and verify your sender/domain.
2. Create SMTP credentials in Brevo.
3. Create a Brevo API key for fallback delivery.
4. Add the values to backend environment variables.

### Required SMTP Variables

```env
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your-brevo-smtp-login
EMAIL_PASSWORD=your-brevo-smtp-key
EMAIL_FROM="CareQueue <noreply@carequeue.com>"
```

### Fallback Variable

```env
BREVO_API_KEY=your-brevo-api-key
```

Notes:
- If SMTP fails and BREVO_API_KEY is set, the service retries the same message through Brevo API automatically.
- If BREVO_API_KEY is missing, fallback is disabled and SMTP becomes the only channel.

## Local Development Example

```env
FRONTEND_URL=http://localhost:5173
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your-brevo-smtp-login
EMAIL_PASSWORD=your-brevo-smtp-key
EMAIL_FROM="CareQueue <noreply@carequeue.com>"
BREVO_API_KEY=your-brevo-api-key
```

## Email Templates

The following templates are available in the email service:

1. consentRequestEmail()
2. emergencyAccessEmail()
3. verificationEmail()
4. appointmentReminderEmail()
5. prescriptionEmail()
6. appointmentCancelledEmail()
7. registrationOtpEmail()
8. passwordResetOtpEmail()
9. appointmentBookedEmail()

## Testing Email Delivery

Run the backend and trigger flows that send email:

- Registration OTP
- Password reset OTP
- Appointment booking notification

You should observe one of these log outcomes:

- SMTP success
- SMTP failure followed by Brevo API fallback success
- SMTP failure and Brevo API failure

## Troubleshooting

### SMTP works intermittently

- Confirm EMAIL_HOST and EMAIL_PORT are Brevo values.
- Confirm EMAIL_USER and EMAIL_PASSWORD are SMTP credentials from Brevo.
- Check network egress/firewall rules for SMTP ports.

### Fallback not used after SMTP failure

- Confirm BREVO_API_KEY is set.
- Confirm BREVO API key has transactional email permission.
- Check backend logs for Brevo API status codes.

### Emails going to spam

- Add SPF, DKIM, and DMARC records for your sender domain.
- Use a verified sender/domain in Brevo.
- Avoid spam-triggering subject/content patterns.

## Future Enhancement

For high-volume or high-reliability delivery, add queue + retry orchestration (for example Bull with Redis) so transient provider failures can be retried with backoff.
