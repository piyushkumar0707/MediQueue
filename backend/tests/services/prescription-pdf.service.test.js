import { PDFParse } from 'pdf-parse';
import { generatePrescriptionPDF } from '../../src/services/pdfGenerators.js';

const extractPdfText = async (buffer) => {
  const parser = new PDFParse({ data: buffer });
  try {
    const textResult = await parser.getText();
    return textResult.text;
  } finally {
    await parser.destroy();
  }
};

const buildPatient = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439011',
  email: 'demo.patient@mediqueue.local',
  phoneNumber: '9876543210',
  personalInfo: {
    firstName: 'Aarav',
    lastName: 'Patel',
    dateOfBirth: new Date('1996-04-01'),
    gender: 'male',
  },
  ...overrides,
});

const buildDoctor = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439012',
  email: 'demo.doctor@mediqueue.local',
  phoneNumber: '9000000001',
  personalInfo: {
    firstName: 'Meera',
    lastName: 'Shah',
  },
  professionalInfo: {
    specialty: 'General Physician',
    licenseNumber: 'DEMO-LIC-900001',
  },
  ...overrides,
});

const buildPrescription = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439013',
  prescriptionNumber: 'RX-202603-0002',
  createdAt: new Date('2026-03-20T09:30:00.000Z'),
  validUntil: new Date('2026-04-19T09:30:00.000Z'),
  diagnosis: 'Fever and mild dehydration',
  medicines: [
    {
      name: 'Paracetamol',
      dosage: '500mg',
      frequency: 'Twice daily',
      duration: '5 days',
      instructions: 'Take after meals and drink plenty of water',
    },
  ],
  notes: 'Take complete rest for 3 days and maintain hydration.',
  tests: ['Complete blood count'],
  followUpDate: new Date('2026-03-27T00:00:00.000Z'),
  followUpInstructions: 'Visit again if fever persists.',
  ...overrides,
});

describe('generatePrescriptionPDF', () => {
  test('returns a readable PDF with corrected field mappings and clean labels', async () => {
    const pdfBuffer = await generatePrescriptionPDF(
      buildPrescription(),
      buildPatient(),
      buildDoctor()
    );

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(1000);

    const extractedText = await extractPdfText(pdfBuffer);
    const normalizedText = extractedText.replace(/\s+/g, ' ');

    expect(normalizedText).toMatch(/Medical Prescription/i);
    expect(normalizedText).toMatch(/Prescription No:\s*RX-202603-0002/i);
    expect(normalizedText).toMatch(/Contact:\s*9876543210/i);
    expect(normalizedText).toMatch(/Specialty:\s*General Physician/i);
    expect(normalizedText).toMatch(/Reg No:\s*DEMO-LIC-900001/i);
    expect(normalizedText).toMatch(/Follow-up Date:/i);

    expect(normalizedText).not.toMatch(/\u{1F4DE}|\u{1F4E7}|\u{1F310}|\u{1F4C5}/u);
    expect(normalizedText).not.toMatch(/[ØÙ]/);
  });

  test('renders long medication lists across page breaks without truncating final rows', async () => {
    const longPrescription = buildPrescription({
      medicines: Array.from({ length: 42 }, (_, index) => ({
        name: `Medicine ${index + 1}`,
        dosage: '250mg',
        frequency: 'Once daily',
        duration: '14 days',
        instructions: 'Take after food with water and avoid skipping doses.',
      })),
    });

    const pdfBuffer = await generatePrescriptionPDF(
      longPrescription,
      buildPatient(),
      buildDoctor()
    );

    const extractedText = await extractPdfText(pdfBuffer);
    const normalizedText = extractedText.replace(/\s+/g, ' ');

    expect(normalizedText).toMatch(/Medicine 1/);
    expect(normalizedText).toMatch(/Medicine 42/);
  });
});
