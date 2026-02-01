# Real-Time Notifications System - Quick Reference

## 🚀 Quick Start

### Backend (Already Running)
The notification system is automatically initialized with the backend server:
```bash
cd backend
npm start
```

### Frontend (Already Running)
Socket.io client connects automatically when you log in:
```bash
cd frontend
npm run dev
```

## 📡 How It Works

### 1. Backend Creates Notification
```javascript
import Notification from '../models/Notification.js';
import notificationService from '../services/notificationService.js';

// Create notification
const notification = await Notification.create({
  recipient: patientId,
  sender: doctorId,
  type: 'appointment_booked',
  title: 'Appointment Confirmed',
  message: 'Your appointment with Dr. Smith on Feb 15 at 10:00 AM has been confirmed.',
  priority: 'medium',
  relatedEntity: {
    entityType: 'Appointment',
    entityId: appointmentId
  },
  actionUrl: '/patient/appointments',
  channels: {
    inApp: true,
    email: true,
    sms: false
  }
});

// Send via all channels
await notificationService.sendNotification(notification);
```

### 2. Frontend Receives Notification
```javascript
// Automatically handled by NotificationBell component
// - Badge updates
// - Dropdown shows new notification
// - Browser notification (if enabled)
// - Notification center updates
```

## 📋 Notification Types

| Type | Description | Priority | Channels |
|------|-------------|----------|----------|
| `consent_request` | Doctor requests consent | Medium | In-app, Email |
| `consent_granted` | Patient grants consent | Medium | In-app, Email |
| `consent_revoked` | Patient revokes consent | High | In-app, Email |
| `emergency_access` | Emergency access granted | Urgent | All |
| `emergency_flagged` | Emergency access flagged for review | Urgent | In-app, Email |
| `emergency_reviewed` | Admin reviewed emergency access | High | In-app, Email |
| `emergency_revoked` | Emergency access revoked | High | In-app, Email |
| `appointment_booked` | Appointment confirmed | Medium | In-app, Email |
| `appointment_cancelled` | Appointment cancelled | High | In-app, Email |
| `appointment_rescheduled` | Appointment rescheduled | Medium | In-app, Email |
| `appointment_reminder` | Reminder before appointment | Medium | All |
| `prescription_created` | New prescription available | Medium | In-app, Email |
| `prescription_updated` | Prescription updated | Medium | In-app, Email |
| `record_accessed` | Someone accessed your records | High | In-app, Email |
| `record_updated` | Your medical record updated | Medium | In-app |
| `message_received` | New message received | Medium | In-app |
| `queue_status` | Queue status changed (Your Turn!) | High | All |
| `system_announcement` | System-wide announcement | Low | In-app |

## 🎨 Priority Levels

- **Urgent** (🔴): Emergency situations, immediate action required
- **High** (🟠): Important notifications, requires attention soon
- **Medium** (🟡): Standard notifications
- **Low** (🔵): Informational, no action required

## 📧 Email Templates

### Available Templates
1. **Consent Request** - `emailService.consentRequestEmail()`
2. **Emergency Access Alert** - `emailService.emergencyAccessEmail()`
3. **Appointment Reminder** - `emailService.appointmentReminderEmail()`
4. **Appointment Booked** - `emailService.appointmentBookedEmail()`
5. **Appointment Cancelled** - `emailService.appointmentCancelledEmail()`
6. **Prescription** - `emailService.prescriptionEmail()`

### Configure Email Service
1. Create Gmail App Password (see `backend/EMAIL_SETUP.md`)
2. Add to `.env`:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM="CareQueue <noreply@carequeue.com>"
FRONTEND_URL=http://localhost:5173
```
3. Restart backend

## 🔔 Frontend Components

### NotificationBell
Location: Navigation bars (Patient, Doctor, Admin)
```jsx
import NotificationBell from '../components/navigation/NotificationBell';

<NotificationBell />
```

Features:
- Badge with unread count
- Dropdown with 5 recent notifications
- Click to mark as read
- "View All" button
- Real-time updates via Socket.io

### NotificationCenter
Routes:
- `/patient/notifications`
- `/doctor/notifications`
- `/admin/notifications`

Features:
- Full notification history
- Filters (type, priority, status)
- Pagination (20 per page)
- Mark all as read
- Clear read notifications
- Priority icons

## 🛠️ API Endpoints

### Get Notifications
```
GET /api/notifications?page=1&limit=20&type=all&priority=all&status=all
Authorization: Bearer {token}
```

Response:
```json
{
  "success": true,
  "data": [...notifications],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 87,
    "hasMore": true
  }
}
```

### Get Unread Count
```
GET /api/notifications/unread-count
Authorization: Bearer {token}
```

Response:
```json
{
  "success": true,
  "count": 5
}
```

### Mark as Read
```
PATCH /api/notifications/{id}/read
Authorization: Bearer {token}
```

### Mark All as Read
```
PATCH /api/notifications/mark-all-read
Authorization: Bearer {token}
```

### Clear Read Notifications
```
DELETE /api/notifications/clear-read
Authorization: Bearer {token}
```

## 🧪 Testing

### Test Email Templates
```bash
cd backend
node scripts/testEmail.js
```

### Create Test Notifications
```bash
cd backend
node scripts/testNotifications.js
```

### Test Real-time Delivery
1. Open app in two browser windows
2. Log in as doctor in window 1
3. Log in as patient in window 2
4. Doctor calls next patient from queue
5. Patient should see notification instantly

## 🔧 Troubleshooting

### Notifications Not Appearing
1. **Check Socket.io connection**: Browser DevTools > Network > WS tab
2. **Check backend logs**: `backend/logs/combined.log`
3. **Verify JWT token**: Check localStorage in DevTools
4. **Check MongoDB**: `carequeue` database, `notifications` collection

### Email Not Sending
1. **Check .env**: EMAIL_USER and EMAIL_PASSWORD configured?
2. **Check logs**: Look for "Email service is ready"
3. **Test Gmail**: Use App Password, not regular password
4. **Check spam folder**: Emails might be filtered

### Badge Count Not Updating
1. **Check Socket.io**: Is client connected?
2. **Check store**: Open Redux DevTools
3. **Check API**: Test `/api/notifications/unread-count`
4. **Refresh page**: Force re-fetch

## 📊 Monitoring

### Check Notification Stats
```
GET /api/notifications/stats
Authorization: Bearer {token}
```

Response:
```json
{
  "success": true,
  "data": {
    "totalNotifications": 500,
    "unreadCount": 25,
    "byType": {...},
    "byPriority": {...},
    "recentNotifications": [...]
  }
}
```

### Check Email Logs
```bash
# Backend logs
tail -f backend/logs/combined.log | grep "Email"

# Look for:
# - "Email service is ready"
# - "Email sent to {email}"
# - "Email sending failed"
```

## 🚨 Common Issues

### Issue: Socket.io not connecting
**Solution**: Check CORS settings in `server.js`

### Issue: Notifications created but not showing
**Solution**: Check recipient ID matches logged-in user

### Issue: Email templates broken
**Solution**: Check HTML structure, test with `testEmail.js`

### Issue: Badge stuck at old count
**Solution**: Call `/api/notifications/unread-count` to refresh

## 💡 Pro Tips

1. **Use appropriate priority**: Don't overuse "urgent"
2. **Keep messages concise**: Especially for SMS (future)
3. **Include action URLs**: Deep link to relevant pages
4. **Test on mobile**: Ensure responsive design works
5. **Monitor delivery rates**: Check email bounce rates
6. **Set up email queue**: For high-volume scenarios (future)
7. **Enable browser notifications**: Ask user permission
8. **Clean old notifications**: Run cleanup job monthly

## 📞 Need Help?

- **Email Setup**: Read `backend/EMAIL_SETUP.md`
- **Full Documentation**: Read `docs/NOTIFICATIONS_IMPLEMENTATION.md`
- **Test Scripts**: Run scripts in `backend/scripts/`
- **Logs**: Check `backend/logs/combined.log`

---

**Quick Reference Version**: 1.0.0  
**Last Updated**: February 1, 2026
