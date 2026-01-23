import mongoose from 'mongoose';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mediqueue', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const checkRawQueue = async () => {
  try {
    const db = mongoose.connection.db;
    const queuesCollection = db.collection('queues');
    
    console.log('🔍 Raw queue data from MongoDB:\n');
    const queues = await queuesCollection.find({}).toArray();
    
    if (queues.length === 0) {
      console.log('❌ No queue entries found!');
    } else {
      queues.forEach((q, idx) => {
        console.log(`Entry ${idx + 1}:`);
        console.log(JSON.stringify(q, null, 2));
        console.log('\n---\n');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

mongoose.connection.once('open', () => {
  checkRawQueue();
});
