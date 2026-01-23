import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Queue from '../src/models/Queue.js';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mediqueue', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const checkPatientQueue = async () => {
  try {
    console.log('🔍 Checking patient queue status...\n');
    
    // Find the patient
    const patient = await User.findOne({ email: 'patient@test.com' });
    if (!patient) {
      console.log('❌ Patient not found with email patient@test.com');
      process.exit(1);
    }
    
    console.log('✅ Patient found:');
    console.log('   ID:', patient._id.toString());
    console.log('   Name:', patient.personalInfo.firstName, patient.personalInfo.lastName);
    console.log('   Email:', patient.email);

    // Find queue entries for this patient
    console.log('\n📋 Queue Status for Patient:');
    const queues = await Queue.find({ patient: patient._id })
      .populate('doctor', 'personalInfo email')
      .sort({ checkInTime: -1 });
    
    if (queues.length === 0) {
      console.log('   ❌ No queue entries found for this patient');
      console.log('   Patient needs to join a queue to see queue status on dashboard');
    } else {
      queues.forEach((q, idx) => {
        console.log(`\n   Entry ${idx + 1}:`);
        console.log('   Queue ID:', q._id.toString());
        console.log('   Queue Number:', q.queueNumber);
        console.log('   Status:', q.status);
        console.log('   Doctor:', q.doctor ? `${q.doctor.personalInfo.firstName} ${q.doctor.personalInfo.lastName}` : 'NULL');
        console.log('   Priority:', q.priority);
        console.log('   Check-in Time:', q.checkInTime);
        console.log('   Estimated Wait:', q.estimatedWaitTime, 'minutes');
        console.log('   Reason:', q.reasonForVisit);
      });

      // Check active queue
      const activeQueue = queues.find(q => q.status === 'waiting' || q.status === 'in-progress');
      if (activeQueue) {
        console.log('\n✅ Patient has an ACTIVE queue entry!');
        console.log('   Status:', activeQueue.status);
        console.log('   This should show on the patient dashboard');
      } else {
        console.log('\n⚠️  Patient has queue entries but none are active (waiting/in-progress)');
        console.log('   Only active queue entries show on the dashboard');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

mongoose.connection.once('open', () => {
  checkPatientQueue();
});
