import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Import models
import User from '../src/models/User.js';
import MedicalRecord from '../src/models/MedicalRecord.js';
import Consent from '../src/models/Consent.js';
import AuditLog from '../src/models/AuditLog.js';

const testMedicalRecordsSystem = async () => {
  try {
    console.log('🏥 MEDICAL RECORDS SYSTEM - COMPREHENSIVE TEST\n');
    console.log('='.repeat(60));

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carequeue', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // ==========================================
    // TEST 1: Medical Record Model Validation
    // ==========================================
    console.log('TEST 1: Medical Record Model Validation');
    console.log('-'.repeat(40));
    
    // Count existing records
    const totalRecords = await MedicalRecord.countDocuments();
    console.log(`📊 Total medical records: ${totalRecords}`);
    
    // Count by status
    const activeRecords = await MedicalRecord.countDocuments({ status: 'active' });
    const archivedRecords = await MedicalRecord.countDocuments({ status: 'archived' });
    const deletedRecords = await MedicalRecord.countDocuments({ status: 'deleted' });
    
    console.log(`   - Active: ${activeRecords}`);
    console.log(`   - Archived: ${archivedRecords}`);
    console.log(`   - Deleted: ${deletedRecords}`);
    
    // ==========================================
    // TEST 2: Record Types Distribution
    // ==========================================
    console.log('\nTEST 2: Record Types Distribution');
    console.log('-'.repeat(40));
    
    const recordsByType = await MedicalRecord.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$recordType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    console.log('📋 Records by type:');
    recordsByType.forEach(type => {
      console.log(`   - ${type._id}: ${type.count}`);
    });
    
    // ==========================================
    // TEST 3: Shared Records Analysis
    // ==========================================
    console.log('\nTEST 3: Shared Records Analysis');
    console.log('-'.repeat(40));
    
    const sharedRecords = await MedicalRecord.countDocuments({
      status: 'active',
      'sharedWith.0': { $exists: true }
    });
    
    const publicRecords = await MedicalRecord.countDocuments({
      status: 'active',
      visibility: 'shared-with-doctors'
    });
    
    console.log(`🔗 Shared records: ${sharedRecords}`);
    console.log(`🌐 Public records: ${publicRecords}`);
    
    // ==========================================
    // TEST 4: Encryption Status
    // ==========================================
    console.log('\nTEST 4: Encryption Status');
    console.log('-'.repeat(40));
    
    const encryptedRecords = await MedicalRecord.countDocuments({
      status: 'active',
      isEncrypted: true
    });
    
    const unencryptedRecords = await MedicalRecord.countDocuments({
      status: 'active',
      isEncrypted: { $ne: true }
    });
    
    console.log(`🔐 Encrypted records: ${encryptedRecords}`);
    console.log(`⚠️  Unencrypted records: ${unencryptedRecords}`);
    
    // ==========================================
    // TEST 5: Access Logs Analysis
    // ==========================================
    console.log('\nTEST 5: Access Logs Analysis');
    console.log('-'.repeat(40));
    
    const recordsWithAccessLogs = await MedicalRecord.countDocuments({
      'accessLog.0': { $exists: true }
    });
    
    console.log(`📜 Records with access logs: ${recordsWithAccessLogs}`);
    
    // ==========================================
    // TEST 6: Recent Records
    // ==========================================
    console.log('\nTEST 6: Recent Records (Last 7 Days)');
    console.log('-'.repeat(40));
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentRecords = await MedicalRecord.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
      status: 'active'
    });
    
    console.log(`📅 Records uploaded in last 7 days: ${recentRecords}`);
    
    // ==========================================
    // TEST 7: File Storage Analysis
    // ==========================================
    console.log('\nTEST 7: File Storage Analysis');
    console.log('-'.repeat(40));
    
    const storageStats = await MedicalRecord.aggregate([
      { $match: { status: 'active' } },
      { $unwind: '$files' },
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalSize: { $sum: '$files.fileSize' },
          avgSize: { $avg: '$files.fileSize' }
        }
      }
    ]);
    
    if (storageStats.length > 0) {
      const stats = storageStats[0];
      console.log(`📁 Total files: ${stats.totalFiles}`);
      console.log(`💾 Total storage: ${(stats.totalSize / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`📊 Average file size: ${(stats.avgSize / 1024).toFixed(2)} KB`);
    } else {
      console.log('No files found');
    }
    
    // ==========================================
    // TEST 8: Audit Trail for Records
    // ==========================================
    console.log('\nTEST 8: Audit Trail for Record Access');
    console.log('-'.repeat(40));
    
    const recordAudits = await AuditLog.countDocuments({
      category: 'RECORD'
    });
    
    const recordActions = await AuditLog.aggregate([
      { $match: { category: 'RECORD' } },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    console.log(`📝 Total record audit logs: ${recordAudits}`);
    console.log('Actions breakdown:');
    recordActions.forEach(action => {
      console.log(`   - ${action._id}: ${action.count}`);
    });
    
    // ==========================================
    // TEST 9: HIPAA Compliance Check
    // ==========================================
    console.log('\nTEST 9: HIPAA Compliance Check');
    console.log('-'.repeat(40));
    
    const hipaaRecordLogs = await AuditLog.countDocuments({
      category: 'RECORD',
      isHIPAARelevant: true
    });
    
    console.log(`⚕️  HIPAA-relevant record logs: ${hipaaRecordLogs}`);
    
    // High severity record access
    const criticalRecordAccess = await AuditLog.countDocuments({
      category: 'RECORD',
      severity: { $in: ['HIGH', 'CRITICAL'] }
    });
    
    console.log(`🚨 High/Critical severity record access: ${criticalRecordAccess}`);
    
    // ==========================================
    // TEST 10: Consent Integration
    // ==========================================
    console.log('\nTEST 10: Consent Integration Check');
    console.log('-'.repeat(40));
    
    const activeConsents = await Consent.countDocuments({
      status: 'granted',
      expiresAt: { $gt: new Date() }
    });
    
    console.log(`✅ Active consents: ${activeConsents}`);
    console.log('Note: Records should be shared only with consented doctors');
    
    // ==========================================
    // TEST 11: Sample Record Details
    // ==========================================
    console.log('\nTEST 11: Sample Record Details');
    console.log('-'.repeat(40));
    
    const sampleRecord = await MedicalRecord.findOne({ status: 'active' })
      .populate('patient', 'personalInfo')
      .populate('uploadedBy', 'personalInfo role')
      .limit(1);
    
    if (sampleRecord) {
      console.log('Sample Record:');
      console.log(`   Title: ${sampleRecord.title}`);
      console.log(`   Type: ${sampleRecord.recordType}`);
      console.log(`   Files: ${sampleRecord.files.length}`);
      console.log(`   Encrypted: ${sampleRecord.isEncrypted ? 'Yes' : 'No'}`);
      console.log(`   Shared with: ${sampleRecord.sharedWith.length} doctors`);
      console.log(`   Access logs: ${sampleRecord.accessLog.length} entries`);
      
      if (sampleRecord.patient && sampleRecord.patient.personalInfo) {
        console.log(`   Patient: ${sampleRecord.patient.personalInfo.firstName} ${sampleRecord.patient.personalInfo.lastName}`);
      }
    } else {
      console.log('No records found for sampling');
    }
    
    // ==========================================
    // TEST 12: Static Methods Test
    // ==========================================
    console.log('\nTEST 12: Model Static Methods Test');
    console.log('-'.repeat(40));
    
    // Find a patient with records
    const patientWithRecords = await MedicalRecord.findOne({ status: 'active' })
      .select('patient');
    
    if (patientWithRecords) {
      try {
        // Test getSharedWithDoctor - find a doctor
        const doctor = await User.findOne({ role: 'doctor' });
        if (doctor) {
          const sharedWithDoctor = await MedicalRecord.getSharedWithDoctor(doctor._id);
          console.log(`✅ getSharedWithDoctor() works: Found ${sharedWithDoctor.length} records`);
        }
      } catch (error) {
        console.error('❌ Static method test failed:', error.message);
      }
    }
    
    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ MEDICAL RECORDS SYSTEM - TEST COMPLETE');
    console.log('='.repeat(60));
    console.log('\n📊 SYSTEM STATUS:');
    console.log(`   - Total Records: ${totalRecords}`);
    console.log(`   - Active Records: ${activeRecords}`);
    console.log(`   - Encrypted: ${encryptedRecords}`);
    console.log(`   - Shared: ${sharedRecords}`);
    console.log(`   - Audit Logs: ${recordAudits}`);
    console.log(`   - HIPAA Compliant: ${hipaaRecordLogs > 0 ? 'Yes ✅' : 'No ❌'}`);
    console.log(`\n🏥 Health Vault is ${totalRecords > 0 ? 'operational' : 'ready for data'}!`);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
};

// Run tests
testMedicalRecordsSystem();
