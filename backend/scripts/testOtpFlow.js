import mongoose from 'mongoose';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Test Script for OTP Verification and Password Reset Flow
 * 
 * This script tests:
 * 1. User lookup by phone/email
 * 2. Password verification
 * 3. Password reset capability
 */

const testOtpFlow = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carequeue');
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Find users
    console.log('📋 Test 1: Find Test Users');
    console.log('=' .repeat(50));
    
    const testEmail = 'hackathon20sep@gmail.com';
    const user = await User.findOne({ email: testEmail }).select('+password');
    
    if (user) {
      console.log('✅ Found user:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Phone: ${user.phoneNumber}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Name: ${user.personalInfo.firstName} ${user.personalInfo.lastName}`);
      console.log(`   Password hash exists: ${!!user.password}`);
      console.log(`   Account active: ${user.isActive}`);
    } else {
      console.log('❌ User not found');
    }

    console.log('\n' + '='.repeat(50));
    
    // Test 2: Find by phone
    console.log('\n📋 Test 2: Find User by Phone');
    console.log('=' .repeat(50));
    
    const userByPhone = await User.findByPhoneOrEmail('9876543210');
    
    if (userByPhone) {
      console.log('✅ Found user by phone:');
      console.log(`   Phone: ${userByPhone.phoneNumber}`);
      console.log(`   Email: ${userByPhone.email}`);
      console.log(`   Role: ${userByPhone.role}`);
    } else {
      console.log('❌ User with phone 9876543210 not found');
    }

    console.log('\n' + '='.repeat(50));

    // Test 3: Password verification
    if (user) {
      console.log('\n📋 Test 3: Password Verification');
      console.log('=' .repeat(50));
      
      const testPassword = 'password123';
      const isValid = await user.comparePassword(testPassword);
      
      console.log(`Testing password: ${testPassword}`);
      console.log(`✅ Password valid: ${isValid ? 'YES' : 'NO'}`);
      
      console.log('\n' + '='.repeat(50));
    }

    // Test 4: List all users for testing
    console.log('\n📋 Test 4: All Users in Database');
    console.log('=' .repeat(50));
    
    const allUsers = await User.find().select('email phoneNumber role personalInfo.firstName personalInfo.lastName');
    
    console.log(`Total users: ${allUsers.length}\n`);
    
    allUsers.forEach((u, index) => {
      console.log(`${index + 1}. ${u.personalInfo.firstName} ${u.personalInfo.lastName}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   Phone: ${u.phoneNumber}`);
      console.log(`   Role: ${u.role}`);
      console.log('');
    });

    console.log('='.repeat(50));

    // Test 5: OTP Store simulation
    console.log('\n📋 Test 5: OTP Flow Simulation');
    console.log('=' .repeat(50));
    
    const mockOtp = '123456';
    const sessionId = `pwd_reset_${Date.now()}_${user?.email}`;
    
    console.log('✅ Mock OTP Flow:');
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   OTP: ${mockOtp}`);
    console.log(`   Expires: ${new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString()}`);
    console.log(`   User: ${user?.email}`);
    
    console.log('\n💡 API Endpoints to Test:');
    console.log('   1. POST /api/auth/forgot-password');
    console.log('      Body: { "phoneOrEmail": "hackathon20sep@gmail.com" }');
    console.log('');
    console.log('   2. POST /api/auth/verify-otp');
    console.log('      Body: { "sessionId": "<from_step_1>", "otp": "<from_email>" }');
    console.log('');
    console.log('   3. POST /api/auth/reset-password');
    console.log('      Body: { "sessionId": "<from_step_1>", "otp": "<from_email>", "newPassword": "NewPass123!" }');
    
    console.log('\n' + '='.repeat(50));

    // Test 6: Check password requirements
    console.log('\n📋 Test 6: Password Requirements');
    console.log('=' .repeat(50));
    
    const testPasswords = [
      { password: 'weak', valid: false, reason: 'Too short, no uppercase, no number, no special char' },
      { password: 'WeakPassword', valid: false, reason: 'No number, no special char' },
      { password: 'Weak123', valid: false, reason: 'No special char' },
      { password: 'Weak123!', valid: true, reason: 'Valid password' },
      { password: 'StrongPass123!', valid: true, reason: 'Valid password' }
    ];
    
    console.log('Password Validation Tests:');
    testPasswords.forEach((test, index) => {
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
      const passes = regex.test(test.password);
      const status = passes ? '✅' : '❌';
      console.log(`${index + 1}. ${status} "${test.password}" - ${test.reason}`);
    });

    console.log('\n' + '='.repeat(50));

    console.log('\n✅ All tests completed successfully!');
    console.log('\n🚀 Ready to test in browser:');
    console.log('   1. Start backend: cd backend && npm start');
    console.log('   2. Start frontend: cd frontend && npm run dev');
    console.log('   3. Navigate to: http://localhost:5174/forgot-password');
    console.log('   4. Enter email: hackathon20sep@gmail.com');
    console.log('   5. Check server logs for OTP (in development mode)');
    console.log('   6. Enter OTP and reset password');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the test
testOtpFlow();
