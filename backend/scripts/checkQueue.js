import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Queue from '../src/models/Queue.js';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mediqueue', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const checkQueue = async () => {
  try {
    console.log('🔍 Checking queue data...\n');
    
    // Find the doctor
    const doctor = await User.findOne({ email: 'doctor@test.com' });
    if (!doctor) {
      console.error('❌ Doctor not found!');
      process.exit(1);
    }
    console.log('✅ Doctor found:');
    console.log('   ID:', doctor._id.toString());
    console.log('   Name:', doctor.personalInfo.firstName, doctor.personalInfo.lastName);
    console.log('   Email:', doctor.email);
    console.log('   Role:', doctor.role);

    // Find all queue entries
    console.log('\n📋 All Queue Entries:');
    const allQueues = await Queue.find({})
      .populate('patient', 'personalInfo email')
      .populate('doctor', 'personalInfo email');
    
    if (allQueues.length === 0) {
      console.log('   ❌ No queue entries found!');
    } else {
      allQueues.forEach((q, idx) => {
        console.log(`\n   Entry ${idx + 1}:`);
        console.log('   Queue ID:', q._id.toString());
        console.log('   Queue Number:', q.queueNumber);
        console.log('   Status:', q.status);
        console.log('   Patient ID:', q.patient ? q.patient._id.toString() : 'NULL');
        console.log('   Patient Name:', q.patient ? `${q.patient.personalInfo.firstName} ${q.patient.personalInfo.lastName}` : 'NULL');
        console.log('   Doctor ID:', q.doctor ? q.doctor._id.toString() : 'NULL');
        console.log('   Doctor Name:', q.doctor ? `${q.doctor.personalInfo.firstName} ${q.doctor.personalInfo.lastName}` : 'NULL');
        console.log('   Reason:', q.reasonForVisit);
        console.log('   Priority:', q.priority);
        console.log('   Check-in Time:', q.checkInTime);
      });
    }

    // Find queue entries for this specific doctor
    console.log('\n\n🔍 Queue entries for doctor@test.com:');
    const doctorQueues = await Queue.find({ doctor: doctor._id })
      .populate('patient', 'personalInfo email');
    
    if (doctorQueues.length === 0) {
      console.log('   ❌ No queue entries found for this doctor!');
    } else {
      console.log(`   ✅ Found ${doctorQueues.length} entries`);
      doctorQueues.forEach((q, idx) => {
        console.log(`\n   Entry ${idx + 1}:`);
        console.log('   Queue Number:', q.queueNumber);
        console.log('   Status:', q.status);
        console.log('   Patient:', q.patient.personalInfo.firstName, q.patient.personalInfo.lastName);
      });
    }

    // Check waiting queue specifically
    console.log('\n\n⏳ Waiting Queue for doctor:');
    const waitingQueues = await Queue.find({
      doctor: doctor._id,
      status: 'waiting'
    }).populate('patient', 'personalInfo email');

    if (waitingQueues.length === 0) {
      console.log('   ❌ No patients in waiting queue!');
    } else {
      console.log(`   ✅ Found ${waitingQueues.length} waiting patients`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkQueue();
