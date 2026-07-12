import User from '../../src/models/User.js';

const PASS = 'DemoPass@123';

export const DEMO_USERS = {
  // ── Admin ──────────────────────────────────────────────────────────
  admin: {
    email: 'demo.admin@mediqueue.local',
    phoneNumber: '9000003001',
    countryCode: '+91',
    password: PASS,
    role: 'admin',
    personalInfo: {
      firstName: 'Nikhil',
      lastName: 'Rao',
      dateOfBirth: new Date('1990-01-22'),
      gender: 'male',
      bloodGroup: 'A+',
      address: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    },
  },

  // ── Doctors ────────────────────────────────────────────────────────
  doctorGeneral: {
    email: 'demo.doctor@mediqueue.local',
    phoneNumber: '9000002001',
    countryCode: '+91',
    password: PASS,
    role: 'doctor',
    personalInfo: {
      firstName: 'Meera',
      lastName: 'Shah',
      dateOfBirth: new Date('1987-09-10'),
      gender: 'female',
      bloodGroup: 'O+',
      address: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    },
    professionalInfo: {
      licenseNumber: 'DEMO-LIC-900001',
      specialty: 'General Medicine',
      qualifications: ['MBBS', 'MD – Internal Medicine'],
      experience: 12,
      consultationFee: 800,
      availability: [
        { day: 1, startTime: '09:00', endTime: '17:00' },
        { day: 3, startTime: '09:00', endTime: '17:00' },
        { day: 5, startTime: '10:00', endTime: '16:00' },
      ],
      slotDuration: 15,
      maxPatientsPerDay: 30,
      isVerified: true,
      bio: 'Senior General Physician at MediQueue Demo Clinic. 12 years of clinical experience.',
    },
  },
  doctorCardio: {
    email: 'demo.cardiologist@mediqueue.local',
    phoneNumber: '9000002002',
    countryCode: '+91',
    password: PASS,
    role: 'doctor',
    personalInfo: {
      firstName: 'Arjun',
      lastName: 'Verma',
      dateOfBirth: new Date('1980-03-15'),
      gender: 'male',
      bloodGroup: 'B+',
      address: { city: 'Delhi', state: 'Delhi', country: 'India' },
    },
    professionalInfo: {
      licenseNumber: 'DEMO-LIC-900002',
      specialty: 'Cardiology',
      qualifications: ['MBBS', 'MD – Cardiology', 'DM – Interventional Cardiology'],
      experience: 18,
      consultationFee: 1500,
      availability: [
        { day: 2, startTime: '10:00', endTime: '14:00' },
        { day: 4, startTime: '10:00', endTime: '14:00' },
      ],
      slotDuration: 20,
      maxPatientsPerDay: 20,
      isVerified: true,
      bio: 'Interventional Cardiologist specialising in complex coronary artery disease.',
    },
  },
  doctorOrtho: {
    email: 'demo.ortho@mediqueue.local',
    phoneNumber: '9000002003',
    countryCode: '+91',
    password: PASS,
    role: 'doctor',
    personalInfo: {
      firstName: 'Priya',
      lastName: 'Nair',
      dateOfBirth: new Date('1985-07-22'),
      gender: 'female',
      bloodGroup: 'A-',
      address: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
    },
    professionalInfo: {
      licenseNumber: 'DEMO-LIC-900003',
      specialty: 'Orthopaedics',
      qualifications: ['MBBS', 'MS – Orthopaedics'],
      experience: 10,
      consultationFee: 900,
      availability: [
        { day: 1, startTime: '11:00', endTime: '17:00' },
        { day: 3, startTime: '11:00', endTime: '17:00' },
        { day: 5, startTime: '09:00', endTime: '13:00' },
      ],
      slotDuration: 15,
      maxPatientsPerDay: 25,
      isVerified: true,
      bio: 'Orthopaedic surgeon specialising in joint replacement and sports injuries.',
    },
  },

  // ── Patients ───────────────────────────────────────────────────────
  patient: {
    email: 'demo.patient@mediqueue.local',
    phoneNumber: '9000001001',
    countryCode: '+91',
    password: PASS,
    role: 'patient',
    personalInfo: {
      firstName: 'Aarav',
      lastName: 'Patel',
      dateOfBirth: new Date('1995-04-18'),
      gender: 'male',
      bloodGroup: 'B+',
      address: { street: '14 Elm Street', city: 'Ahmedabad', state: 'Gujarat', country: 'India' },
    },
    medicalInfo: {
      allergies: ['Penicillin', 'Dust'],
      chronicConditions: ['Hypertension', 'Mild Asthma'],
      emergencyContact: { name: 'Riya Patel', relation: 'Spouse', phoneNumber: '9000001009' },
    },
  },
  patientRohan: {
    email: 'demo.patient2@mediqueue.local',
    phoneNumber: '9000001002',
    countryCode: '+91',
    password: PASS,
    role: 'patient',
    personalInfo: {
      firstName: 'Rohan',
      lastName: 'Singh',
      dateOfBirth: new Date('1988-11-05'),
      gender: 'male',
      bloodGroup: 'O+',
      address: { city: 'Pune', state: 'Maharashtra', country: 'India' },
    },
    medicalInfo: {
      allergies: ['Sulfa drugs'],
      chronicConditions: ['Type 2 Diabetes', 'Hypertension'],
      emergencyContact: { name: 'Anita Singh', relation: 'Spouse', phoneNumber: '9000001019' },
    },
  },
  patientFatima: {
    email: 'demo.patient3@mediqueue.local',
    phoneNumber: '9000001003',
    countryCode: '+91',
    password: PASS,
    role: 'patient',
    personalInfo: {
      firstName: 'Fatima',
      lastName: 'Khan',
      dateOfBirth: new Date('2000-06-12'),
      gender: 'female',
      bloodGroup: 'AB+',
      address: { city: 'Hyderabad', state: 'Telangana', country: 'India' },
    },
    medicalInfo: {
      allergies: [],
      chronicConditions: ['Iron deficiency anaemia'],
      emergencyContact: { name: 'Tariq Khan', relation: 'Father', phoneNumber: '9000001029' },
    },
  },
  patientSuresh: {
    email: 'demo.patient4@mediqueue.local',
    phoneNumber: '9000001004',
    countryCode: '+91',
    password: PASS,
    role: 'patient',
    personalInfo: {
      firstName: 'Suresh',
      lastName: 'Iyer',
      dateOfBirth: new Date('1965-02-28'),
      gender: 'male',
      bloodGroup: 'A+',
      address: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
    },
    medicalInfo: {
      allergies: ['Aspirin'],
      chronicConditions: ['Coronary Artery Disease', 'Hyperlipidaemia'],
      emergencyContact: { name: 'Kamala Iyer', relation: 'Spouse', phoneNumber: '9000001039' },
    },
  },
  patientAnanya: {
    email: 'demo.patient5@mediqueue.local',
    phoneNumber: '9000001005',
    countryCode: '+91',
    password: PASS,
    role: 'patient',
    personalInfo: {
      firstName: 'Ananya',
      lastName: 'Gupta',
      dateOfBirth: new Date('1992-09-30'),
      gender: 'female',
      bloodGroup: 'B-',
      address: { city: 'Kolkata', state: 'West Bengal', country: 'India' },
    },
    medicalInfo: {
      allergies: ['Latex'],
      chronicConditions: ['Hypothyroidism'],
      emergencyContact: { name: 'Vikram Gupta', relation: 'Husband', phoneNumber: '9000001049' },
    },
  },
};

const applyPayload = (user, payload) => {
  user.phoneNumber         = payload.phoneNumber;
  user.countryCode         = payload.countryCode;
  user.email               = payload.email;
  user.password            = payload.password;
  user.role                = payload.role;
  user.personalInfo        = payload.personalInfo;
  user.isActive            = true;
  user.isEmailVerified     = true;
  user.isPhoneVerified     = true;
  user.mfaEnabled          = false;
  if (payload.professionalInfo) user.professionalInfo = payload.professionalInfo;
  if (payload.medicalInfo)      user.medicalInfo      = payload.medicalInfo;
};

export const seedDemoUsers = async () => {
  const result = { created: 0, updated: 0, users: {}, credentials: {} };

  for (const [key, payload] of Object.entries(DEMO_USERS)) {
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = new User({});
      applyPayload(user, payload);
      await user.save({ validateModifiedOnly: true });
      result.created += 1;
    } else {
      applyPayload(user, payload);
      await user.save({ validateModifiedOnly: true });
      result.updated += 1;
    }
    result.users[key] = user;
    result.credentials[key] = { email: payload.email, password: payload.password };
  }

  return result;
};

export const demoUserEmails = Object.values(DEMO_USERS).map(u => u.email);
