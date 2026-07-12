import MedicalRecord from '../../src/models/MedicalRecord.js';

const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

const PDF = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
const IMG = 'https://upload.wikimedia.org/wikipedia/commons/1/14/Gatto_europeo4.jpg'; // placeholder image

const buildRecords = ({ patient, patientRohan, patientFatima, patientSuresh, patientAnanya, doctorGeneral, doctorCardio, doctorOrtho, admin }) => [

  // ── Aarav Patel (demo.patient) ─────────────────────────────────────
  {
    marker: 'DEMO:rec:aarav-cbc',
    payload: {
      patient: patient._id, uploadedBy: doctorGeneral._id,
      recordType: 'lab-report', title: 'Complete Blood Count – Jun 2026',
      description: 'Routine CBC panel. Mild anaemia noted — haemoglobin 11.2 g/dL.',
      recordDate: daysAgo(5),
      files: [{ fileName: 'aarav-cbc-jun26.pdf', fileUrl: PDF, cloudinaryPublicId: '', fileType: 'application/pdf', fileSize: 248512 }],
      metadata: { hospital: 'MediQueue Demo Clinic', doctorName: 'Dr. Meera Shah', department: 'General Medicine', diagnosis: 'Mild anaemia – iron supplementation initiated', tags: ['DEMO:rec:aarav-cbc', 'demo'] },
      visibility: 'shared-with-doctors',
      sharedWith: [{ doctor: doctorGeneral._id, sharedAt: daysAgo(5), canDownload: true }],
      status: 'active', isEncrypted: true,
    },
  },
  {
    marker: 'DEMO:rec:aarav-bp',
    payload: {
      patient: patient._id, uploadedBy: patient._id,
      recordType: 'consultation-notes', title: 'Hypertension Monitoring – May 2026',
      description: 'Monthly BP log. Average reading: 138/88 mmHg. Amlodipine dose maintained.',
      recordDate: daysAgo(22),
      files: [{ fileName: 'aarav-bp-may26.pdf', fileUrl: PDF, cloudinaryPublicId: '', fileType: 'application/pdf', fileSize: 102400 }],
      metadata: { hospital: 'MediQueue Demo Clinic', doctorName: 'Dr. Meera Shah', department: 'General Medicine', diagnosis: 'Stage 1 hypertension – controlled', tags: ['DEMO:rec:aarav-bp', 'demo'] },
      visibility: 'private',
      sharedWith: [],
      status: 'active', isEncrypted: true,
    },
  },
  {
    marker: 'DEMO:rec:aarav-chest-xray',
    payload: {
      patient: patient._id, uploadedBy: doctorGeneral._id,
      recordType: 'radiology', title: 'Chest X-Ray – Asthma Follow-up',
      description: 'PA view chest X-ray. Mild hyperinflation consistent with known asthma. No infiltrates.',
      recordDate: daysAgo(40),
      files: [{ fileName: 'aarav-chest-xray.jpg', fileUrl: IMG, cloudinaryPublicId: '', fileType: 'image/jpeg', fileSize: 512000 }],
      metadata: { hospital: 'MediQueue Demo Clinic', doctorName: 'Dr. Meera Shah', department: 'Radiology', diagnosis: 'Mild hyperinflation – asthma', tags: ['DEMO:rec:aarav-chest-xray', 'demo'] },
      visibility: 'shared-with-doctors',
      sharedWith: [{ doctor: doctorGeneral._id, sharedAt: daysAgo(40), canDownload: true }],
      status: 'active', isEncrypted: true,
    },
  },
  {
    marker: 'DEMO:rec:aarav-vaccination',
    payload: {
      patient: patient._id, uploadedBy: admin._id,
      recordType: 'vaccination', title: 'Vaccination Record – COVID-19 & Flu',
      description: 'COVID-19 (Covishield) 2 doses + booster. Flu vaccine – annual 2025.',
      recordDate: daysAgo(180),
      files: [{ fileName: 'aarav-vaccination-record.pdf', fileUrl: PDF, cloudinaryPublicId: '', fileType: 'application/pdf', fileSize: 76800 }],
      metadata: { hospital: 'MediQueue Demo Clinic', doctorName: 'Admin', department: 'Preventive Medicine', diagnosis: 'Up to date on vaccinations', tags: ['DEMO:rec:aarav-vaccination', 'demo'] },
      visibility: 'private', sharedWith: [],
      status: 'active', isEncrypted: true,
    },
  },

  // ── Rohan Singh (demo.patient2) ────────────────────────────────────
  {
    marker: 'DEMO:rec:rohan-hba1c',
    payload: {
      patient: patientRohan._id, uploadedBy: doctorGeneral._id,
      recordType: 'lab-report', title: 'HbA1c & Fasting Blood Sugar – Jun 2026',
      description: 'HbA1c: 8.1% (poorly controlled). FBS: 162 mg/dL. Metformin dose escalated.',
      recordDate: daysAgo(3),
      files: [{ fileName: 'rohan-hba1c-jun26.pdf', fileUrl: PDF, cloudinaryPublicId: '', fileType: 'application/pdf', fileSize: 193280 }],
      metadata: { hospital: 'MediQueue Demo Clinic', doctorName: 'Dr. Meera Shah', department: 'General Medicine', diagnosis: 'Type 2 Diabetes – suboptimal control', tags: ['DEMO:rec:rohan-hba1c', 'demo'] },
      visibility: 'shared-with-doctors',
      sharedWith: [{ doctor: doctorGeneral._id, sharedAt: daysAgo(3), canDownload: true }],
      status: 'active', isEncrypted: true,
    },
  },
  {
    marker: 'DEMO:rec:rohan-echo',
    payload: {
      patient: patientRohan._id, uploadedBy: doctorCardio._id,
      recordType: 'radiology', title: 'Echocardiogram – Cardiac Screening',
      description: 'Transthoracic echo. EF: 58%. Mild LVH consistent with hypertension. No valvular disease.',
      recordDate: daysAgo(14),
      files: [{ fileName: 'rohan-echo-report.pdf', fileUrl: PDF, cloudinaryPublicId: '', fileType: 'application/pdf', fileSize: 614400 }],
      metadata: { hospital: 'MediQueue Demo Clinic', doctorName: 'Dr. Arjun Verma', department: 'Cardiology', diagnosis: 'Mild LVH – continued antihypertensive therapy', tags: ['DEMO:rec:rohan-echo', 'demo'] },
      visibility: 'shared-with-doctors',
      sharedWith: [{ doctor: doctorCardio._id, sharedAt: daysAgo(14), canDownload: true }, { doctor: doctorGeneral._id, sharedAt: daysAgo(12), canDownload: false }],
      status: 'active', isEncrypted: true,
    },
  },
  {
    marker: 'DEMO:rec:rohan-discharge',
    payload: {
      patient: patientRohan._id, uploadedBy: doctorGeneral._id,
      recordType: 'discharge-summary', title: 'Discharge Summary – Hyperglycaemic Crisis',
      description: 'Admitted for hyperglycaemic hyperosmolar state. Stabilised on IV insulin. Discharged with revised oral regimen.',
      recordDate: daysAgo(90),
      files: [{ fileName: 'rohan-discharge-summary.pdf', fileUrl: PDF, cloudinaryPublicId: '', fileType: 'application/pdf', fileSize: 307200 }],
      metadata: { hospital: 'MediQueue Demo Clinic', doctorName: 'Dr. Meera Shah', department: 'General Medicine', diagnosis: 'Hyperglycaemic hyperosmolar state – resolved', tags: ['DEMO:rec:rohan-discharge', 'demo'] },
      visibility: 'private', sharedWith: [],
      status: 'active', isEncrypted: true,
    },
  },

  // ── Fatima Khan (demo.patient3) ────────────────────────────────────
  {
    marker: 'DEMO:rec:fatima-iron',
    payload: {
      patient: patientFatima._id, uploadedBy: doctorGeneral._id,
      recordType: 'lab-report', title: 'Iron Studies & CBC – Anaemia Workup',
      description: 'Serum ferritin: 6 ng/mL (low). TIBC elevated. Iron deficiency anaemia confirmed. IV iron sucrose initiated.',
      recordDate: daysAgo(7),
      files: [{ fileName: 'fatima-iron-studies.pdf', fileUrl: PDF, cloudinaryPublicId: '', fileType: 'application/pdf', fileSize: 165000 }],
      metadata: { hospital: 'MediQueue Demo Clinic', doctorName: 'Dr. Meera Shah', department: 'General Medicine', diagnosis: 'Iron deficiency anaemia', tags: ['DEMO:rec:fatima-iron', 'demo'] },
      visibility: 'shared-with-doctors',
      sharedWith: [{ doctor: doctorGeneral._id, sharedAt: daysAgo(7), canDownload: true }],
      status: 'active', isEncrypted: true,
    },
  },
  {
    marker: 'DEMO:rec:fatima-history',
    payload: {
      patient: patientFatima._id, uploadedBy: patientFatima._id,
      recordType: 'medical-history', title: 'Personal Medical History',
      description: 'Family history: father – Thalassaemia trait. No known surgeries. No chronic medications prior to this year.',
      recordDate: daysAgo(30),
      files: [{ fileName: 'fatima-medical-history.pdf', fileUrl: PDF, cloudinaryPublicId: '', fileType: 'application/pdf', fileSize: 54000 }],
      metadata: { hospital: 'Self-Uploaded', doctorName: '', department: '', diagnosis: '', tags: ['DEMO:rec:fatima-history', 'demo'] },
      visibility: 'private', sharedWith: [],
      status: 'active', isEncrypted: true,
    },
  },

  // ── Suresh Iyer (demo.patient4) ────────────────────────────────────
  {
    marker: 'DEMO:rec:suresh-angio',
    payload: {
      patient: patientSuresh._id, uploadedBy: doctorCardio._id,
      recordType: 'radiology', title: 'Coronary Angiography Report',
      description: '70% stenosis in LAD. PCI performed with drug-eluting stent. Successful revascularisation.',
      recordDate: daysAgo(60),
      files: [{ fileName: 'suresh-angio-report.pdf', fileUrl: PDF, cloudinaryPublicId: '', fileType: 'application/pdf', fileSize: 819200 }],
      metadata: { hospital: 'MediQueue Demo Clinic', doctorName: 'Dr. Arjun Verma', department: 'Cardiology', diagnosis: 'CAD – LAD stenosis, post-PCI', tags: ['DEMO:rec:suresh-angio', 'demo'] },
      visibility: 'shared-with-doctors',
      sharedWith: [{ doctor: doctorCardio._id, sharedAt: daysAgo(60), canDownload: true }],
      status: 'active', isEncrypted: true,
    },
  },
  {
    marker: 'DEMO:rec:suresh-lipid',
    payload: {
      patient: patientSuresh._id, uploadedBy: doctorCardio._id,
      recordType: 'lab-report', title: 'Lipid Profile – Post-PCI Monitoring',
      description: 'LDL: 98 mg/dL (target <70 not yet achieved). Rosuvastatin 20mg daily. Follow-up in 6 weeks.',
      recordDate: daysAgo(15),
      files: [{ fileName: 'suresh-lipid-jun26.pdf', fileUrl: PDF, cloudinaryPublicId: '', fileType: 'application/pdf', fileSize: 122000 }],
      metadata: { hospital: 'MediQueue Demo Clinic', doctorName: 'Dr. Arjun Verma', department: 'Cardiology', diagnosis: 'Hyperlipidaemia – on treatment', tags: ['DEMO:rec:suresh-lipid', 'demo'] },
      visibility: 'shared-with-doctors',
      sharedWith: [{ doctor: doctorCardio._id, sharedAt: daysAgo(15), canDownload: true }],
      status: 'active', isEncrypted: true,
    },
  },
  {
    marker: 'DEMO:rec:suresh-ecg',
    payload: {
      patient: patientSuresh._id, uploadedBy: doctorCardio._id,
      recordType: 'radiology', title: '12-Lead ECG – Routine Post-PCI',
      description: 'Normal sinus rhythm. No ST changes. T-wave normalisation noted. No new ischaemia.',
      recordDate: daysAgo(8),
      files: [{ fileName: 'suresh-ecg.jpg', fileUrl: IMG, cloudinaryPublicId: '', fileType: 'image/jpeg', fileSize: 256000 }],
      metadata: { hospital: 'MediQueue Demo Clinic', doctorName: 'Dr. Arjun Verma', department: 'Cardiology', diagnosis: 'Normal ECG post-PCI', tags: ['DEMO:rec:suresh-ecg', 'demo'] },
      visibility: 'shared-with-doctors',
      sharedWith: [{ doctor: doctorCardio._id, sharedAt: daysAgo(8), canDownload: true }],
      status: 'active', isEncrypted: true,
    },
  },

  // ── Ananya Gupta (demo.patient5) ───────────────────────────────────
  {
    marker: 'DEMO:rec:ananya-tsh',
    payload: {
      patient: patientAnanya._id, uploadedBy: doctorGeneral._id,
      recordType: 'lab-report', title: 'Thyroid Function Test – Jun 2026',
      description: 'TSH: 7.2 mIU/L (elevated). Free T4: 0.9 ng/dL. Levothyroxine dose increased to 75mcg.',
      recordDate: daysAgo(2),
      files: [{ fileName: 'ananya-tft-jun26.pdf', fileUrl: PDF, cloudinaryPublicId: '', fileType: 'application/pdf', fileSize: 143000 }],
      metadata: { hospital: 'MediQueue Demo Clinic', doctorName: 'Dr. Meera Shah', department: 'General Medicine', diagnosis: 'Hypothyroidism – dose adjustment required', tags: ['DEMO:rec:ananya-tsh', 'demo'] },
      visibility: 'shared-with-doctors',
      sharedWith: [{ doctor: doctorGeneral._id, sharedAt: daysAgo(2), canDownload: true }],
      status: 'active', isEncrypted: true,
    },
  },
  {
    marker: 'DEMO:rec:ananya-mri-knee',
    payload: {
      patient: patientAnanya._id, uploadedBy: doctorOrtho._id,
      recordType: 'radiology', title: 'MRI Right Knee – Sports Injury Assessment',
      description: 'Partial thickness tear of the medial meniscus. No ligament disruption. Conservative management recommended.',
      recordDate: daysAgo(45),
      files: [{ fileName: 'ananya-mri-knee.pdf', fileUrl: PDF, cloudinaryPublicId: '', fileType: 'application/pdf', fileSize: 2097152 }],
      metadata: { hospital: 'MediQueue Demo Clinic', doctorName: 'Dr. Priya Nair', department: 'Orthopaedics', diagnosis: 'Partial medial meniscus tear – conservative Rx', tags: ['DEMO:rec:ananya-mri-knee', 'demo'] },
      visibility: 'shared-with-doctors',
      sharedWith: [{ doctor: doctorOrtho._id, sharedAt: daysAgo(45), canDownload: true }],
      status: 'active', isEncrypted: true,
    },
  },
];

export const seedDemoRecords = async (users) => {
  const MedicalRecord = (await import('../../src/models/MedicalRecord.js')).default;
  const result = { created: 0, updated: 0 };

  for (const item of buildRecords(users)) {
    let rec = await MedicalRecord.findOne({ 'metadata.tags': item.marker });
    if (!rec) {
      rec = new MedicalRecord(item.payload);
      await rec.save({ validateModifiedOnly: true });
      result.created += 1;
    } else {
      Object.assign(rec, item.payload);
      await rec.save({ validateModifiedOnly: true });
      result.updated += 1;
    }
  }

  return result;
};
