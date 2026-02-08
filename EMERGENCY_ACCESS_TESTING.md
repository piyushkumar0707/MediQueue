# Emergency Access Testing Guide

## Prerequisites
- Backend server running on `http://localhost:5000`
- Frontend server running on `http://localhost:5173`
- MongoDB running locally
- Test users created with roles: `doctor`, `patient`, `admin`

---

## Test Setup

### 1. Create Test Users (if not already exists)

**Admin User:**
```
Email: admin@test.com
Password: Admin123!
Role: admin
```

**Doctor User:**
```
Email: doctor@test.com
Password: Doctor123!
Role: doctor
Name: Dr. John Smith
```

**Patient User:**
```
Email: patient@test.com
Password: Patient123!
Role: patient
Name: Jane Doe
```

---

## Testing Flow

### Phase 1: Doctor Requests Emergency Access

**Objective:** Test the emergency access request flow from doctor's perspective

#### Steps:

1. **Login as Doctor**
   - Navigate to `http://localhost:5173/login`
   - Login with doctor credentials: `doctor@test.com` / `Doctor123!`
   - Should redirect to `/doctor` dashboard

2. **Navigate to Emergency Requests Page**
   - Click on "Emergency Access" 🚨 in the sidebar
   - Or navigate to `http://localhost:5173/doctor/emergency-requests`
   - Should see empty state: "No emergency requests found"

3. **Request Emergency Access (Option A - Via API)**
   - Open browser console (F12)
   - Get patient ID: You'll need a patient ID from the database
   
   ```javascript
   // Get patient ID first
   fetch('http://localhost:5173/api/users?role=patient')
     .then(r => r.json())
     .then(d => console.log('Patient ID:', d.data[0]._id));
   ```

4. **Request Emergency Access (Manual via UI)**
   - Since we haven't integrated the modal into SharedRecords yet, use this approach:
   - Open browser console and run:
   
   ```javascript
   // Replace PATIENT_ID with actual patient ID
   const emergencyRequest = {
     patientId: 'PATIENT_ID_HERE',
     emergencyType: 'life-threatening',
     justification: 'Patient arrived unconscious at emergency room with severe head trauma. No family members present to provide consent. Immediate access to medical history required to assess allergies and previous conditions that may affect treatment plan.',
     location: 'Emergency Room - Bay 3',
     facilityName: 'City General Hospital'
   };

   fetch('http://localhost:5000/api/emergency-access/request', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer YOUR_TOKEN_HERE'
     },
     body: JSON.stringify(emergencyRequest)
   })
   .then(r => r.json())
   .then(d => console.log('Emergency Access Created:', d));
   ```

   **To get your token:**
   ```javascript
   const authStorage = JSON.parse(localStorage.getItem('auth-storage'));
   const token = authStorage.state.accessToken;
   console.log('Your Token:', token);
   ```

5. **Verify Emergency Access Created**
   - Refresh the emergency requests page
   - Should see new request with:
     - ✅ Status: "Active" (green badge)
     - Emergency type displayed
     - Justification shown
     - Time remaining indicator (e.g., "23h 59m remaining")
     - Patient information
     - Requested date/time

6. **Check Auto-Flagging**
   - Create another request with SHORT justification (< 50 characters):
   ```javascript
   const shortRequest = {
     patientId: 'SAME_PATIENT_ID',
     emergencyType: 'critical-care',
     justification: 'Emergency situation needs access', // Only 35 chars
     location: 'ICU',
     facilityName: 'City Hospital'
   };
   // Send same way as above
   ```
   - Should see red border on the request
   - 🚩 "Flagged for Review" indicator
   - Flagged reason: "Insufficient justification length"

---

### Phase 2: Doctor Accesses Patient Records via Emergency Access

**Objective:** Verify that doctor can access patient records during emergency

#### Steps:

1. **Check Emergency Access Status**
   - Make API call to check access:
   ```javascript
   // Use patient ID from Phase 1
   fetch('http://localhost:5000/api/emergency-access/check/PATIENT_ID', {
     headers: {
       'Authorization': 'Bearer YOUR_TOKEN'
     }
   })
   .then(r => r.json())
   .then(d => console.log('Has Access:', d.data.hasAccess)); // Should be true
   ```

2. **Access Patient Records**
   - Navigate to `/doctor/shared-records`
   - The patient's records should now appear in the list (if they have any)
   - OR use API:
   ```javascript
   // Get records for patient
   fetch('http://localhost:5000/api/records/patient/PATIENT_ID', {
     headers: {
       'Authorization': 'Bearer YOUR_TOKEN'
     }
   })
   .then(r => r.json())
   .then(d => console.log('Patient Records:', d));
   ```

3. **View Specific Record**
   - Click on any record or use API:
   ```javascript
   fetch('http://localhost:5000/api/records/RECORD_ID', {
     headers: {
       'Authorization': 'Bearer YOUR_TOKEN'
     }
   })
   .then(r => r.json())
   .then(d => console.log('Record Details:', d));
   ```

4. **Verify Access Logging**
   - Go back to emergency requests page
   - Click on the active emergency access
   - Should see "Access Log" section with entries:
     - Timestamp
     - Action: "viewed"
     - Record type
     - IP address

---

### Phase 3: Admin Reviews Emergency Access

**Objective:** Test admin review workflow

#### Steps:

1. **Logout and Login as Admin**
   - Logout from doctor account
   - Login with admin credentials: `admin@test.com` / `Admin123!`
   - Should redirect to `/admin` dashboard

2. **Navigate to Emergency Access Review**
   - Click on "Emergency Access" 🔐 in the sidebar
   - Or navigate to `http://localhost:5173/admin/emergency-access`

3. **View Statistics Cards**
   - Should see 4 cards:
     - **Total Requests**: Count of all emergency accesses
     - **Unreviewed**: Yellow count (should be 1 or 2)
     - **Flagged**: Red count (should be 1 if you created short justification)
     - **Active**: Green count (should match active accesses)

4. **Filter by Unreviewed**
   - Click "Unreviewed" filter tab
   - Should see only unreviewed requests
   - Note: Requests with short justifications will also show here

5. **Filter by Flagged**
   - Click "Flagged" filter tab
   - Should see the request with short justification
   - Row will have red background
   - 🚩 "Flagged" indicator under risk level

6. **Review Emergency Access**
   - Click the 👁️ (Eye) icon on any request
   - Review modal opens showing:
     - Doctor information
     - Patient information
     - Emergency type
     - Risk level badge
     - Location & Facility
     - **Justification** (full text)
     - Flagged warning (if applicable)
     - Requested & Expires dates
     - Status badge
     - Access log (if doctor accessed records)

7. **Submit Review - Approved**
   - Select decision: "Approved - Legitimate emergency access"
   - Add review notes: "Verified with ER staff. Legitimate emergency case. Patient was unconscious and required immediate care."
   - Click "Submit Review"
   - Should see success toast
   - Request should now show:
     - Review decision: "approved"
     - Reviewed by: Admin name
     - Reviewed date/time

8. **Submit Review - Flagged**
   - Review another request (preferably the short justification one)
   - Select decision: "Flagged - Needs further investigation"
   - Add notes: "Justification too short. Need more details on emergency nature."
   - Click "Submit Review"
   - Should see the flagged decision

9. **Submit Review - Revoked**
   - Review any suspicious request
   - Select decision: "Revoked - Inappropriate use"
   - Add notes: "No emergency detected. Patient was scheduled for routine checkup."
   - Click "Submit Review"
   - Emergency access status should change to "Revoked"
   - Doctor loses access immediately

10. **View Access Log**
    - Click 📄 (FileText) icon on request that has been used
    - Access log modal opens
    - Should show table with:
      - Time of access
      - Action (viewed/downloaded/shared)
      - Record type
      - IP address

---

### Phase 4: Doctor Revokes Emergency Access

**Objective:** Test doctor's ability to revoke their own emergency access

#### Steps:

1. **Login Back as Doctor**
   - Logout from admin
   - Login as doctor

2. **Navigate to Emergency Requests**
   - Go to `/doctor/emergency-requests`

3. **View Active Request**
   - Find the active emergency access
   - Should see "Revoke Access" button (red) in top-right

4. **Revoke Access**
   - Click "Revoke Access" ❌
   - Confirm in dialog
   - Should see success toast
   - Status changes to "Revoked" (red badge)
   - Button disappears

5. **Verify Lost Access**
   - Try to access patient records again
   - Should no longer see those records in shared records
   - OR test via API:
   ```javascript
   fetch('http://localhost:5000/api/emergency-access/check/PATIENT_ID', {
     headers: {
       'Authorization': 'Bearer YOUR_TOKEN'
     }
   })
   .then(r => r.json())
   .then(d => console.log('Has Access:', d.data.hasAccess)); // Should be false
   ```

---

### Phase 5: Test 24-Hour Expiry

**Objective:** Verify emergency access expires after 24 hours

#### Option A: Manual Database Update (Quick Test)

1. **Update Expiry in Database**
   - Open MongoDB Compass or mongosh
   - Connect to `carequeue` database
   - Find `emergencyaccesses` collection
   - Find your active emergency access document
   - Update `expiresAt` field to past date:
   ```javascript
   db.emergencyaccesses.updateOne(
     { _id: ObjectId('YOUR_EMERGENCY_ACCESS_ID') },
     { $set: { expiresAt: new Date('2026-01-31') } }
   );
   ```

2. **Trigger Expiry Check**
   - This can be done by:
   - Restarting backend (it will run expiry check on startup if implemented)
   - OR calling the static method via script
   - OR waiting for the next API call that checks `isValid` virtual

3. **Verify Expired Status**
   - Refresh doctor's emergency requests page
   - Status should show "Expired" (gray badge)
   - Time remaining should show "Expired"
   - No revoke button

4. **Verify No Access**
   - Try to access patient records
   - Should not have access
   - Check endpoint returns `hasAccess: false`

#### Option B: Wait 24 Hours (Real Test)
- Create an emergency access
- Wait 24 hours
- Verify automatic expiry
- Check that `EmergencyAccess.expireOldAccesses()` has been run

---

### Phase 6: Edge Cases & Validation

#### Test 1: Duplicate Emergency Access Prevention
```javascript
// Try to create duplicate active access for same patient
const duplicateRequest = {
  patientId: 'SAME_PATIENT_ID',
  emergencyType: 'trauma',
  justification: 'Another emergency request for testing duplicate prevention...',
};

fetch('http://localhost:5000/api/emergency-access/request', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify(duplicateRequest)
})
.then(r => r.json())
.then(d => console.log('Should fail:', d));
// Expected: Error 400 - "Active emergency access already exists for this patient"
```

#### Test 2: Invalid Patient ID
```javascript
const invalidRequest = {
  patientId: '507f1f77bcf86cd799439011', // Non-existent ID
  emergencyType: 'life-threatening',
  justification: 'Testing with invalid patient ID for error handling...',
};
// Expected: Error 404 - "Patient not found"
```

#### Test 3: Short Justification (< 20 chars)
```javascript
const shortJustification = {
  patientId: 'PATIENT_ID',
  emergencyType: 'trauma',
  justification: 'Emergency', // Only 9 chars
};
// Expected: Error 400 - Validation error on justification length
```

#### Test 4: Missing Required Fields
```javascript
const missingFields = {
  patientId: 'PATIENT_ID',
  // Missing emergencyType and justification
};
// Expected: Error 400 - Required fields missing
```

#### Test 5: Admin Can Revoke Any Access
- Login as admin
- Go to emergency access review
- Click revoke on active access
- Should successfully revoke even if not the requesting doctor

---

## Expected Results Summary

### ✅ Success Criteria

1. **Doctor Flow:**
   - ✅ Can request emergency access with proper justification
   - ✅ Access is immediately granted (status: active)
   - ✅ Can access patient records during emergency
   - ✅ All accesses are logged with timestamp and IP
   - ✅ Can view their emergency requests with status
   - ✅ Can revoke their own active access
   - ✅ Short justifications are auto-flagged

2. **Admin Flow:**
   - ✅ Can view all emergency accesses with statistics
   - ✅ Can filter by: all, unreviewed, flagged, active
   - ✅ Can review with 4 decisions: approved/flagged/revoked/legitimate
   - ✅ Can add review notes
   - ✅ Can view access logs showing what records were accessed
   - ✅ Can revoke any active access
   - ✅ Flagged requests are highlighted in red

3. **System Behavior:**
   - ✅ Access expires after 24 hours automatically
   - ✅ Expired access cannot be used
   - ✅ Revoked access is immediate (doctor loses access)
   - ✅ Access log records every record viewed/downloaded/shared
   - ✅ Cannot create duplicate active access for same patient
   - ✅ Proper error handling for invalid data

4. **Security & Compliance:**
   - ✅ All emergency accesses are auditable
   - ✅ Auto-flagging for suspicious patterns
   - ✅ Post-facto admin review required
   - ✅ Time-limited access (24h default)
   - ✅ Full audit trail maintained
   - ✅ Patient notification tracking (structure in place)

---

## Quick Test Script

Run this in browser console when logged in as doctor:

```javascript
// Complete test flow
async function testEmergencyAccess() {
  const auth = JSON.parse(localStorage.getItem('auth-storage'));
  const token = auth.state.accessToken;
  const API = 'http://localhost:5000/api';
  
  console.log('🚀 Starting Emergency Access Test...\n');
  
  // Get a patient ID (you'll need to replace this)
  const patientId = 'YOUR_PATIENT_ID_HERE';
  
  // 1. Request emergency access
  console.log('1️⃣ Requesting emergency access...');
  const request = await fetch(`${API}/emergency-access/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      patientId,
      emergencyType: 'life-threatening',
      justification: 'Patient arrived unconscious with severe trauma. Requires immediate medical history to assess allergies and previous conditions before surgery.',
      location: 'Emergency Room',
      facilityName: 'City General Hospital'
    })
  });
  const emergencyAccess = await request.json();
  console.log('✅ Emergency access created:', emergencyAccess.data._id);
  
  // 2. Check access
  console.log('\n2️⃣ Checking emergency access status...');
  const checkAccess = await fetch(`${API}/emergency-access/check/${patientId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const accessStatus = await checkAccess.json();
  console.log('✅ Has access:', accessStatus.data.hasAccess);
  
  // 3. Get patient records
  console.log('\n3️⃣ Accessing patient records...');
  const records = await fetch(`${API}/records/patient/${patientId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const patientRecords = await records.json();
  console.log('✅ Records accessible:', patientRecords.data?.length || 0);
  
  // 4. View my emergency requests
  console.log('\n4️⃣ Viewing my emergency requests...');
  const myRequests = await fetch(`${API}/emergency-access/my-requests`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const requests = await myRequests.json();
  console.log('✅ My emergency requests:', requests.data?.emergencyAccesses?.length || 0);
  
  console.log('\n🎉 Emergency Access Test Complete!');
  console.log('\nNext steps:');
  console.log('- Login as admin to review the request');
  console.log('- Check access logs in the admin panel');
  console.log('- Try revoking the access');
}

// Run the test
testEmergencyAccess().catch(console.error);
```

---

## Troubleshooting

### Issue: "Cannot access patient records"
- ✓ Check emergency access is active (not expired/revoked)
- ✓ Verify patient ID is correct
- ✓ Check backend logs for access check

### Issue: "Emergency access not showing in admin panel"
- ✓ Refresh the page
- ✓ Check filter is set to "All" or "Unreviewed"
- ✓ Verify data was saved in MongoDB

### Issue: "Access log is empty"
- ✓ Doctor must actually view records after creating emergency access
- ✓ Check that getRecordById is being called
- ✓ Verify access logging code is executing

### Issue: "Cannot revoke access"
- ✓ Check status is "active" (can't revoke expired/revoked)
- ✓ Verify you're the requesting doctor or admin
- ✓ Check backend logs for errors

---

## Database Verification

Check MongoDB directly:

```javascript
// In mongosh or MongoDB Compass

// 1. View all emergency accesses
db.emergencyaccesses.find().pretty();

// 2. View active emergency accesses
db.emergencyaccesses.find({ status: 'active' }).pretty();

// 3. View emergency access with access log
db.emergencyaccesses.find({ 
  'accessLog.0': { $exists: true } 
}).pretty();

// 4. View flagged emergency accesses
db.emergencyaccesses.find({ flaggedForReview: true }).pretty();

// 5. View unreviewed emergency accesses
db.emergencyaccesses.find({ reviewedBy: null }).pretty();
```



## Performance Testing

Test with multiple emergency accesses:

```javascript
// Create 10 emergency accesses for testing
async function createMultipleEmergencies() {
  const types = ['life-threatening', 'critical-care', 'trauma', 'cardiac-emergency'];
  
  for (let i = 0; i < 10; i++) {
    await fetch('http://localhost:5000/api/emergency-access/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN'
      },
      body: JSON.stringify({
        patientId: 'PATIENT_ID',
        emergencyType: types[i % types.length],
        justification: `Emergency case ${i + 1}: Testing multiple emergency accesses for performance and pagination. This is a longer justification to avoid auto-flagging.`,
        location: `ER - Bay ${i + 1}`,
        facilityName: 'Test Hospital'
      })
    });
  }
}
```

---

## Next Steps After Testing

1. **Implement Patient Notification**
   - Email/SMS when emergency access is created
   - In-app notification

2. **Implement Admin Notification**
   - Alert admins of new unreviewed accesses
   - Daily digest of flagged accesses

3. **Add Cron Job**
   - Run `EmergencyAccess.expireOldAccesses()` daily
   - Clean up old expired accesses

4. **Integration with Notification System**
   - Connect to notification service when built
   - Real-time alerts for admins

5. **Analytics Dashboard**
   - Add emergency access metrics to admin analytics
   - Track patterns and abuse

---

## Testing Checklist

- [ ] Doctor can request emergency access
- [ ] Emergency access is auto-approved
- [ ] Doctor can access patient records via emergency access
- [ ] Access is logged in accessLog array
- [ ] Short justifications are auto-flagged
- [ ] Admin can view statistics (total, unreviewed, flagged, active)
- [ ] Admin can filter emergency accesses
- [ ] Admin can review with different decisions
- [ ] Admin can view access logs
- [ ] Admin can revoke active access
- [ ] Doctor can view their emergency requests
- [ ] Doctor can revoke their own access
- [ ] Access expires after 24 hours
- [ ] Expired access cannot be used
- [ ] Cannot create duplicate active access
- [ ] Proper error handling for invalid data
- [ ] All security checks pass
