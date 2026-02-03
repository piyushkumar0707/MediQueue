# Health Vault (Medical Records) System Documentation

**Version:** 1.0  
**Last Updated:** February 3, 2026  
**Status:** ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [API Endpoints](#api-endpoints)
5. [Security & Encryption](#security--encryption)
6. [Usage Examples](#usage-examples)
7. [Frontend Integration](#frontend-integration)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Health Vault is a secure, HIPAA-compliant medical records management system that allows patients to store, manage, and share their medical records with healthcare providers. All files are encrypted at rest and access is strictly controlled based on patient consent.

### Key Capabilities

- ✅ Secure file upload with encryption (AES-256-CBC)
- ✅ Multiple file format support (PDF, Images, DICOM, Office documents)
- ✅ Patient-controlled access with consent management
- ✅ Complete audit trail for all access
- ✅ Record sharing with expiration dates
- ✅ Download with permission checks
- ✅ Categorized record types
- ✅ Search and filter functionality
- ✅ HIPAA compliance with detailed logging

---

## Features

### 1. Record Types Supported

- **Lab Reports** - Blood tests, urinalysis, pathology results
- **Prescriptions** - Medication prescriptions and refills
- **Radiology** - X-rays, CT scans, MRI results, ultrasounds
- **Consultation Notes** - Doctor visit notes and observations
- **Discharge Summaries** - Hospital discharge documentation
- **Medical History** - Past medical conditions and treatments
- **Insurance Documents** - Insurance cards, policy information
- **Vaccination Records** - Immunization history
- **Allergy Information** - Known allergies and reactions
- **Other** - Miscellaneous medical documentation

### 2. File Support

**Supported Formats:**
- PDF (`.pdf`)
- Images (`.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.tiff`)
- Microsoft Word (`.doc`, `.docx`)
- Microsoft Excel (`.xls`, `.xlsx`)
- Plain Text (`.txt`)
- DICOM (`.dcm`) - Medical imaging standard

**Limitations:**
- Max file size: 10 MB per file
- Max files per upload: 5 files
- Total storage: Unlimited (currently)

### 3. Access Control

**Patient Access:**
- Upload records for themselves
- View all their own records
- Share records with doctors (with expiration)
- Revoke doctor access
- Delete records (soft delete)

**Doctor Access:**
- View records explicitly shared with them
- View records with active consent
- Cannot upload records (unless specified)
- Cannot delete patient records

**Admin Access:**
- Full access to all records
- Can upload for any patient
- Can manage sharing permissions
- Can permanently delete records

---

## Architecture

### Database Schema

```javascript
MedicalRecord {
  patient: ObjectId (User),
  uploadedBy: ObjectId (User),
  recordType: String (enum),
  title: String,
  description: String,
  recordDate: Date,
  files: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number,
    uploadedAt: Date
  }],
  metadata: {
    hospital: String,
    doctorName: String,
    department: String,
    diagnosis: String,
    tags: [String]
  },
  isEncrypted: Boolean,
  encryptionKey: String (select: false),
  visibility: String (private/shared-with-doctors/public-to-facility),
  sharedWith: [{
    doctor: ObjectId (User),
    sharedAt: Date,
    expiresAt: Date,
    canDownload: Boolean
  }],
  accessLog: [{
    user: ObjectId (User),
    action: String,
    timestamp: Date,
    ipAddress: String
  }],
  status: String (active/archived/deleted),
  createdAt: Date,
  updatedAt: Date
}
```

### File Storage

**Storage Method:**
- Local filesystem in `backend/uploads/medical-records/`
- Encrypted at rest using AES-256-CBC
- Unique filename generation to prevent collisions
- Secure deletion (file remains but marked as deleted)

**Encryption Process:**
1. File uploaded via Multer
2. File saved to disk temporarily
3. AES-256-CBC encryption applied in place
4. Initialization Vector (IV) stored in database
5. Original file replaced with encrypted version

---

## API Endpoints

### 1. Upload Medical Record

```http
POST /api/records
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- title: String (required)
- description: String (optional)
- recordType: String (required, enum)
- recordDate: Date (optional, default: today)
- patientId: ObjectId (required for doctors/admins)
- files: File[] (required, 1-5 files)
- metadata: JSON (optional)
- visibility: String (optional, default: private)
```

**Response:**
```json
{
  "success": true,
  "message": "Medical record uploaded successfully",
  "data": {
    "_id": "...",
    "title": "Blood Test Results",
    "recordType": "lab-report",
    "files": [...],
    "patient": {...},
    "uploadedBy": {...},
    "createdAt": "2026-02-03T10:30:00Z"
  }
}
```

### 2. Get My Records (Patient)

```http
GET /api/records/my-records
Authorization: Bearer <token>
Query Parameters:
- recordType: String (optional filter)
- startDate: Date (optional)
- endDate: Date (optional)
```

### 3. Get Patient Records (Doctor)

```http
GET /api/records/patient/:patientId
Authorization: Bearer <token> (Doctor/Admin only)
```

**Access Rules:**
- Doctor can only access if consent exists OR record is shared
- Admin has full access

### 4. Get Shared Records (Doctor)

```http
GET /api/records/shared-with-me
Authorization: Bearer <token> (Doctor only)
```

Returns all records explicitly shared with the requesting doctor.

### 5. Get Single Record

```http
GET /api/records/:id
Authorization: Bearer <token>
```

Checks access permissions before returning.

### 6. Share Record with Doctor

```http
POST /api/records/:id/share
Authorization: Bearer <token> (Patient/Admin only)
Content-Type: application/json

Body:
{
  "doctorId": "ObjectId",
  "expiresAt": "2026-03-03T00:00:00Z", // optional
  "canDownload": true // optional, default true
}
```

### 7. Revoke Doctor Access

```http
DELETE /api/records/:id/share/:doctorId
Authorization: Bearer <token> (Patient/Admin only)
```

### 8. Update Record Metadata

```http
PATCH /api/records/:id
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "title": "Updated Title",
  "description": "Updated description",
  "recordType": "radiology",
  "visibility": "shared-with-doctors"
}
```

### 9. Delete Record

```http
DELETE /api/records/:id
Authorization: Bearer <token> (Patient/Admin only)
```

**Note:** Soft delete - record marked as deleted but files retained.

### 10. Get Record Statistics

```http
GET /api/records/stats
Authorization: Bearer <token> (Patient)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRecords": 25,
    "sharedRecords": 5,
    "byType": [
      { "_id": "lab-report", "count": 10 },
      { "_id": "prescription", "count": 8 },
      { "_id": "radiology", "count": 7 }
    ]
  }
}
```

---

## Security & Encryption

### Encryption Implementation

**Algorithm:** AES-256-CBC (Advanced Encryption Standard)

**Key Management:**
- Master encryption key stored in environment variable: `ENCRYPTION_KEY`
- Per-file Initialization Vector (IV) for added security
- IV stored in database alongside file metadata
- Keys never exposed in API responses

**Encryption Flow:**
```
Upload → Save Temp File → Encrypt In Place → Store IV → Delete Original
```

**Decryption Flow:**
```
Request → Check Permissions → Read Encrypted File → Decrypt with IV → Stream to User
```

### Access Control

**Permission Levels:**

1. **Patient owns record:**
   - Full CRUD access
   - Can share/revoke
   - Can delete

2. **Doctor with explicit share:**
   - Read access
   - Download (if permitted)
   - Cannot modify/delete

3. **Admin:**
   - Full access to all records
   - Can upload for any patient
   - Can force delete

### Audit Logging

All record operations logged with:
- User ID and role
- Action type (RECORD_UPLOADED, RECORD_ACCESSED, RECORD_DOWNLOADED, RECORD_SHARED, RECORD_DELETED)
- Timestamp
- IP Address
- User Agent
- HIPAA relevance flag
- Data accessed description

---

## Usage Examples

### Example 1: Patient Uploads Lab Report

```javascript
const formData = new FormData();
formData.append('title', 'Blood Test - January 2026');
formData.append('description', 'Annual health checkup blood work');
formData.append('recordType', 'lab-report');
formData.append('recordDate', '2026-01-15');
formData.append('files', file1);
formData.append('files', file2);

const response = await api.post('/records', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### Example 2: Patient Shares Record with Doctor

```javascript
await api.post(`/records/${recordId}/share`, {
  doctorId: '60d5ec49f1b2c72b8c8e4f1a',
  expiresAt: '2026-03-01T00:00:00Z',
  canDownload: true
});
```

### Example 3: Doctor Views Patient Records

```javascript
const response = await api.get(`/records/patient/${patientId}`);
// Returns only records patient has shared or given consent for
```

### Example 4: Download File

```javascript
const response = await api.get(`/records/${recordId}/download`, {
  responseType: 'blob'
});
const url = window.URL.createObjectURL(new Blob([response]));
const link = document.createElement('a');
link.href = url;
link.setAttribute('download', 'lab-report.pdf');
link.click();
```

---

## Frontend Integration

### Health Vault Page (Patient)

**Location:** `frontend/src/pages/patient/HealthVault.jsx`

**Features:**
- Upload medical records with drag-and-drop
- View all records in card/list view
- Filter by record type
- Search by title
- Share with doctors (modal)
- Download files
- Delete records
- View statistics dashboard

**Key Components:**
- Upload Modal
- Record List/Grid
- Share Modal
- Detail Modal
- Statistics Cards

### Patient Records Page (Doctor)

**Location:** `frontend/src/pages/doctor/PatientRecords.jsx`

**Features:**
- View patient's shared records
- Filter by type and date
- Download permitted files
- Cannot delete or modify
- Consent-based access control

---

## Testing

### Test Script

Run comprehensive system test:

```bash
cd backend
node scripts/testMedicalRecords.js
```

**Tests Performed:**
1. Model validation
2. Record types distribution
3. Shared records analysis
4. Encryption status check
5. Access logs verification
6. Recent records count
7. File storage analysis
8. Audit trail check
9. HIPAA compliance check
10. Consent integration
11. Sample record details
12. Static methods validation

### Manual Testing Checklist

- [ ] Patient can upload records
- [ ] Files are encrypted after upload
- [ ] Patient can view own records
- [ ] Patient can share with doctor
- [ ] Doctor can only access shared records
- [ ] Doctor cannot access without permission
- [ ] Download works correctly
- [ ] Audit logs are created
- [ ] Revoke access works
- [ ] Soft delete preserves data
- [ ] Search and filter work
- [ ] Statistics are accurate

---

## Troubleshooting

### Common Issues

**1. "ENCRYPTION_KEY not configured" Warning**

```bash
# Add to .env file:
ENCRYPTION_KEY=your-32-byte-hex-key-here
```

Generate key:
```javascript
const crypto = require('crypto');
console.log(crypto.randomBytes(32).toString('hex'));
```

**2. File Upload Fails**

Check:
- File size < 10MB
- File type is supported
- Multer middleware configured
- Upload directory exists and writable

**3. Doctor Cannot Access Records**

Verify:
- Patient has shared the record, OR
- Active consent exists for the patient-doctor pair
- Record visibility allows doctor access

**4. Encryption Errors**

- Ensure ENCRYPTION_KEY is exactly 32 bytes
- Check IV is stored correctly in database
- Verify file permissions in uploads directory

**5. Access Denied Errors**

Check:
- User authentication token is valid
- User role has required permissions
- Record belongs to user (for patients)
- Consent/sharing permissions exist (for doctors)

---

## Performance Considerations

### Optimization Tips

1. **Large Files:** Consider cloud storage (AWS S3, Azure Blob) for files > 5MB
2. **Indexing:** Database indexes on patient, recordType, and createdAt
3. **Caching:** Cache frequently accessed records in Redis
4. **Lazy Loading:** Load file content only when needed
5. **Pagination:** Implement pagination for record lists

### Current Limits

- File size: 10 MB per file
- Concurrent uploads: 5 files per request
- Storage: Unlimited (filesystem-based)
- API rate limit: 100 requests/minute per user

---

## Future Enhancements

### Planned Features

1. **Cloud Storage Integration**
   - AWS S3 / Azure Blob Storage
   - CDN for faster downloads
   - Automatic backups

2. **Advanced File Processing**
   - PDF text extraction
   - Image OCR for scanned documents
   - DICOM viewer integration

3. **AI/ML Features**
   - Automatic record categorization
   - Anomaly detection in lab reports
   - Smart tagging and search

4. **Mobile App**
   - Native iOS/Android apps
   - Camera integration for scanning
   - Offline access

5. **Interoperability**
   - HL7 FHIR integration
   - Export to standard formats
   - Integration with hospital systems

---

## Support & Resources

**Documentation:** This file  
**API Reference:** See API Endpoints section  
**Test Scripts:** `backend/scripts/testMedicalRecords.js`  
**Model Source:** `backend/src/models/MedicalRecord.js`  
**Controller Source:** `backend/src/controllers/recordController.js`  
**Frontend Source:** `frontend/src/pages/patient/HealthVault.jsx`

---

## Compliance & Privacy

### HIPAA Compliance

✅ **Technical Safeguards:**
- Encryption at rest (AES-256)
- Encryption in transit (HTTPS/TLS)
- Access controls and authentication
- Audit trails for all access
- Automatic session expiry

✅ **Administrative Safeguards:**
- Role-based access control
- Consent management
- Access revocation capability
- Regular security audits

✅ **Physical Safeguards:**
- Secure server infrastructure
- Backup and disaster recovery
- Physical access controls (hosting provider)

### Data Retention

- Active records: Retained indefinitely
- Deleted records: Soft deleted, retained for 7 years
- Audit logs: Retained for 6 years (HIPAA requirement)
- Backups: Daily backups retained for 30 days

---

**Document Version:** 1.0  
**Last Review:** February 3, 2026  
**Next Review:** March 3, 2026
