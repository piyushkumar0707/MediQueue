import mongoose from 'mongoose';
import User from '../src/models/User.js';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mediqueue', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const updateQueue = async () => {
  try {
    console.log('🔧 Updating queue with correct doctor ID...\n');
    
    // Find the current doctor
    const doctor = await User.findOne({ email: 'doctor@test.com' });
    if (!doctor) {
      console.error('❌ Doctor not found!');
      process.exit(1);
    }
    console.log('✅ Current doctor found:');
    console.log('   ID:', doctor._id.toString());
    console.log('   Name:', doctor.personalInfo.firstName, doctor.personalInfo.lastName);

    // Update all queue entries to use the current doctor
    const db = mongoose.connection.db;
    const queuesCollection = db.collection('queues');
    
    const result = await queuesCollection.updateMany(
      {}, // Update all
      { $set: { doctor: new mongoose.Types.ObjectId(doctor._id) } }
    );

    console.log(`\n✅ Updated ${result.modifiedCount} queue entries`);

    // Verify
    console.log('\n🔍 Verification:');
    const queues = await queuesCollection.find({}).toArray();
    queues.forEach((q, idx) => {
      console.log(`   Entry ${idx + 1}:`);
      console.log('   Doctor ID:', q.doctor.toString());
      console.log('   Patient ID:', q.patient.toString());
      console.log('   Status:', q.status);
      console.log('   Queue Number:', q.queueNumber);
    });

    console.log('\n✅ Queue updated successfully!');
    console.log('   Refresh the doctor dashboard to see patients.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

mongoose.connection.once('open', () => {
  updateQueue();
});
