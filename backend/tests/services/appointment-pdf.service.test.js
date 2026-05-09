import { PDFParse } from 'pdf-parse';
import { generateAppointmentPDF } from '../../src/services/pdfGenerators.js';

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
  _id: '507f1f77bcf86cd799439021',
  email: 'demo.patient@mediqueue.local',
  phoneNumber: '9876543210',
  personalInfo: {
    firstName: 'Piyush',
    lastName: 'Singh',
  },
  ...overrides,
});

const buildDoctor = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439022',
  email: 'demo.doctor@mediqueue.local',
  phoneNumber: '9000000001',
  personalInfo: {
    firstName: 'Meera',
    lastName: 'Shah',
  },
  professionalInfo: {
    specialty: 'General Physician',
  },
  ...overrides,
});

const buildAppointment = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439023',
  appointmentDate: new Date('2026-04-27T12:00:00.000Z'),
  timeSlot: {
    startTime: '09:00',
    endTime: '09:30',
  },
  status: 'scheduled',
  type: 'routine-checkup',
  reasonForVisit: 'Routine blood pressure follow-up',
  ...overrides,
});

describe('generateAppointmentPDF', () => {
  test('renders clean, readable appointment details without mojibake or raw object output', async () => {
    const pdfBuffer = await generateAppointmentPDF(
      buildAppointment(),
      buildPatient(),
      buildDoctor()
    );

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(1000);

    const extractedText = await extractPdfText(pdfBuffer);
    const normalizedText = extractedText.replace(/\s+/g, ' ');

    expect(normalizedText).toMatch(/Appointment Confirmation/i);
    expect(normalizedText).toMatch(/Appointment Confirmed/i);
    expect(normalizedText).toMatch(/Confirmation No:/i);
    expect(normalizedText).toMatch(/Time:\s*09:00 AM - 09:30 AM/i);
    expect(normalizedText).toMatch(/Type:\s*Routine Checkup/i);
    expect(normalizedText).toMatch(/Status:\s*Scheduled/i);
    expect(normalizedText).toMatch(/Specialty:\s*General Physician/i);

    expect(normalizedText).not.toMatch(/\[object Object\]/i);
    expect(normalizedText).not.toMatch(/startTime|endTime/i);
    expect(normalizedText).not.toMatch(/[ØÙ]/);
  });

  test('supports legacy appointment fields and array slot shapes', async () => {
    const pdfBuffer = await generateAppointmentPDF(
      buildAppointment({
        timeSlot: [{ startTime: '14:30', endTime: '15:00' }],
        type: undefined,
        appointmentType: 'follow-up',
        reasonForVisit: undefined,
        reason: 'Legacy follow-up reason',
        status: 'confirmed',
      }),
      buildPatient(),
      buildDoctor({
        professionalInfo: {
          specialization: 'Cardiology',
        },
      })
    );

    const extractedText = await extractPdfText(pdfBuffer);
    const normalizedText = extractedText.replace(/\s+/g, ' ');

    expect(normalizedText).toMatch(/Time:\s*02:30 PM - 03:00 PM/i);
    expect(normalizedText).toMatch(/Type:\s*Follow Up/i);
    expect(normalizedText).toMatch(/Reason for Visit:\s*Legacy follow-up reason/i);
    expect(normalizedText).toMatch(/Specialty:\s*Cardiology/i);
  });
});
