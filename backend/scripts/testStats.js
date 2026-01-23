import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Queue from '../src/models/Queue.js';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mediqueue', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const testStats = async () => {
  try {
    console.log('🔍 Testing stats query...\n');
    
    // Find the doctor
    const doctor = await User.findOne({ email: 'doctor@test.com' });
    console.log('✅ Doctor ID:', doctor._id.toString());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('\n📊 Aggregate Stats:');
    const stats = await Queue.aggregate([
      {
        $match: {
          doctor: doctor._id,
          checkInTime: { $gte: today }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log(JSON.stringify(stats, null, 2));

    console.log('\n📋 Raw Queue Counts:');
    const waiting = await Queue.countDocuments({ doctor: doctor._id, status: 'waiting' });
    const inProgress = await Queue.countDocuments({ doctor: doctor._id, status: 'in-progress' });
    const totalToday = await Queue.countDocuments({ 
      doctor: doctor._id, 
      checkInTime: { $gte: today }
    });

    console.log('Waiting:', waiting);
    console.log('In Progress:', inProgress);
    console.log('Total Today:', totalToday);

    console.log('\n📋 All Queue Entries for Doctor:');
    const allQueues = await Queue.find({ doctor: doctor._id })
      .populate('patient', 'personalInfo');
    
    allQueues.forEach((q, idx) => {
      console.log(`\n  ${idx + 1}. ${q.patient.personalInfo.firstName} ${q.patient.personalInfo.lastName}`);
      console.log(`     Status: ${q.status}`);
      console.log(`     Queue #: ${q.queueNumber}`);
      console.log(`     Check-in: ${q.checkInTime}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

mongoose.connection.once('open', () => {
  testStats();
});
