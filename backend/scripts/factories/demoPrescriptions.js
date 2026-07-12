import Prescription from '../../src/models/Prescription.js';

const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

export const seedDemoPrescriptions = async ({ patient, patientRohan, patientFatima, patientSuresh, patientAnanya, doctorGeneral, doctorCardio, doctorOrtho }) => {
  const result = { created: 0, updated: 0, prescription: null };

  const items = [
    // Aarav Patel – Hypertension + Asthma
    {
      marker: 'DEMO:rx:aarav-htn',
      payload: {
        patient: patient._id, doctor: doctorGeneral._id,
        diagnosis: 'Stage 1 hypertension with stress-related headaches',
        medicines: [
          { name: 'Amlodipine',   dosage: '5mg',   frequency: 'Once daily',  duration: '30 days', instructions: 'Take at the same time each day.',                    timing: 'After Food' },
          { name: 'Paracetamol',  dosage: '500mg', frequency: 'Twice daily', duration: '5 days',  instructions: 'Use only if headache persists.',                     timing: 'After Food' },
          { name: 'Salbutamol',   dosage: '100mcg',frequency: 'PRN',         duration: 'Ongoing', instructions: '2 puffs via MDI when breathless. Max 8 puffs/day.', timing: 'Anytime' },
        ],
        tests: ['Lipid Profile', 'Fasting Blood Sugar', 'Urine Microalbumin'],
        notes: 'DEMO:rx:aarav-htn',
        followUpDate: addDays(14),
        followUpInstructions: 'Review BP log. Repeat lipids in 4 weeks.',
        status: 'active',
      },
    },

    // Rohan Singh – Diabetes + BP
    {
      marker: 'DEMO:rx:rohan-dm',
      payload: {
        patient: patientRohan._id, doctor: doctorGeneral._id,
        diagnosis: 'Type 2 Diabetes Mellitus, poorly controlled. Hypertension.',
        medicines: [
          { name: 'Metformin',       dosage: '1000mg', frequency: 'Twice daily',  duration: '30 days', instructions: 'Take with meals. Do not crush.',              timing: 'After Food' },
          { name: 'Glimepiride',     dosage: '2mg',    frequency: 'Once daily',   duration: '30 days', instructions: 'Take before breakfast.',                      timing: 'Before Food' },
          { name: 'Telmisartan',     dosage: '40mg',   frequency: 'Once daily',   duration: '30 days', instructions: 'Take at the same time each day.',             timing: 'After Food' },
          { name: 'Aspirin EC',      dosage: '75mg',   frequency: 'Once daily',   duration: 'Ongoing', instructions: 'Cardiovascular prophylaxis. Do not stop.',    timing: 'After Food' },
        ],
        tests: ['HbA1c (repeat in 3 months)', 'Urine ACR', 'eGFR', 'Lipid Profile'],
        notes: 'DEMO:rx:rohan-dm',
        followUpDate: addDays(21),
        followUpInstructions: 'Target HbA1c < 7%. Continue carb counting.',
        status: 'active',
      },
    },

    // Fatima Khan – Iron deficiency anaemia
    {
      marker: 'DEMO:rx:fatima-anaemia',
      payload: {
        patient: patientFatima._id, doctor: doctorGeneral._id,
        diagnosis: 'Iron deficiency anaemia. Serum ferritin 6 ng/mL.',
        medicines: [
          { name: 'Ferrous Sulphate',  dosage: '325mg', frequency: 'Twice daily', duration: '60 days', instructions: 'Take on empty stomach with Vitamin C. Avoid tea/coffee 1hr before/after.', timing: 'Before Food' },
          { name: 'Folic Acid',        dosage: '5mg',   frequency: 'Once daily',  duration: '60 days', instructions: 'Take with food.',                                                          timing: 'After Food' },
          { name: 'Vitamin C',         dosage: '500mg', frequency: 'Twice daily', duration: '60 days', instructions: 'Enhances iron absorption — take with iron tablet.',                        timing: 'Before Food' },
        ],
        tests: ['CBC repeat in 6 weeks', 'Serum Ferritin at 8 weeks'],
        notes: 'DEMO:rx:fatima-anaemia',
        followUpDate: addDays(42),
        followUpInstructions: 'Check stool occult blood to rule out GI cause.',
        status: 'active',
      },
    },

    // Suresh Iyer – Post-PCI
    {
      marker: 'DEMO:rx:suresh-cad',
      payload: {
        patient: patientSuresh._id, doctor: doctorCardio._id,
        diagnosis: 'Post-PCI (drug-eluting stent, LAD). Dual antiplatelet therapy phase.',
        medicines: [
          { name: 'Aspirin EC',       dosage: '75mg',   frequency: 'Once daily',  duration: 'Ongoing (lifelong)', instructions: 'Do NOT stop without cardiology clearance. Risk of stent thrombosis.', timing: 'After Food' },
          { name: 'Clopidogrel',      dosage: '75mg',   frequency: 'Once daily',  duration: '12 months',          instructions: 'Dual antiplatelet – minimum 12 months post-DES.',                       timing: 'After Food' },
          { name: 'Rosuvastatin',     dosage: '20mg',   frequency: 'Once daily',  duration: 'Ongoing (lifelong)', instructions: 'Take at bedtime. Target LDL < 70 mg/dL.',                              timing: 'After Food' },
          { name: 'Bisoprolol',       dosage: '2.5mg',  frequency: 'Once daily',  duration: 'Ongoing',            instructions: 'Beta-blocker for cardiac protection.',                                  timing: 'After Food' },
          { name: 'Ramipril',         dosage: '5mg',    frequency: 'Once daily',  duration: 'Ongoing',            instructions: 'ACE inhibitor. Monitor renal function and potassium.',                  timing: 'After Food' },
        ],
        tests: ['Lipid Profile (6 weekly)', 'eGFR', 'Serum Potassium', 'ECG at next visit'],
        notes: 'DEMO:rx:suresh-cad',
        followUpDate: addDays(14),
        followUpInstructions: 'Do NOT miss dual antiplatelet. Report any chest pain immediately.',
        status: 'active',
      },
    },

    // Ananya Gupta – Hypothyroidism + Knee
    {
      marker: 'DEMO:rx:ananya-thyroid',
      payload: {
        patient: patientAnanya._id, doctor: doctorGeneral._id,
        diagnosis: 'Hypothyroidism (TSH elevated at 7.2). Partial medial meniscus tear (co-managed with ortho).',
        medicines: [
          { name: 'Levothyroxine',   dosage: '75mcg', frequency: 'Once daily',  duration: 'Ongoing (lifelong)', instructions: 'Take on empty stomach 30 mins before breakfast. No calcium/iron within 4 hours.', timing: 'Empty Stomach' },
          { name: 'Diclofenac Gel',  dosage: '1%',    frequency: 'Three times daily', duration: '4 weeks',      instructions: 'Apply topically to right knee. Do not cover with bandage.',                       timing: 'Anytime' },
          { name: 'Calcium + Vit D', dosage: '500mg', frequency: 'Once daily',  duration: '90 days',            instructions: 'Take with food. Do not take within 4 hours of Levothyroxine.',                   timing: 'After Food' },
        ],
        tests: ['TSH repeat in 6 weeks', 'Free T4', 'Lipid Profile (hypothyroidism risk)'],
        notes: 'DEMO:rx:ananya-thyroid',
        followUpDate: addDays(42),
        followUpInstructions: 'Continue physiotherapy for knee. Report any palpitations or weight changes.',
        status: 'active',
      },
    },
  ];

  for (const item of items) {
    let rx = await Prescription.findOne({ notes: item.marker });
    if (!rx) {
      rx = new Prescription(item.payload);
      await rx.save({ validateModifiedOnly: true });
      result.created += 1;
    } else {
      Object.assign(rx, item.payload);
      await rx.save({ validateModifiedOnly: true });
      result.updated += 1;
    }
    if (!result.prescription) result.prescription = rx;
  }

  return result;
};

export const demoPrescriptionMarker = 'DEMO:rx:aarav-htn';
