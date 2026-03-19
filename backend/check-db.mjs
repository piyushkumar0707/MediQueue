import { MongoClient } from 'mongodb';

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function checkDatabase() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('carequeue');
    const users = await db.collection('users')
      .find({}, { projection: { email: 1, phoneNumber: 1, role: 1, name: 1 } })
      .toArray();
    
    console.log(`📊 Total users: ${users.length}\n`);
    
    if (users.length > 0) {
      console.log('👥 Users in database:');
      users.forEach((user, i) => {
        console.log(`  ${i + 1}. ${user.email || user.phoneNumber} (${user.role})`);
      });
    } else {
      console.log('⚠️  No users found - database is empty!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkDatabase();
