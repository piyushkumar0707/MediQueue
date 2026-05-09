import pdfService from './pdfService.js';
import { logger } from '../utils/logger.js';

const EMOJI_REGEX = /\p{Extended_Pictographic}/gu;

const cleanText = (value, fallback = 'N/A') => {
  if (value === null || value === undefined) {
    return fallback;
  }

  const normalized = String(value)
    .replace(EMOJI_REGEX, '')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized || fallback;
};

const toTitleCase = (value) => {
  const normalized = cleanText(value, 'N/A');
  if (normalized === 'N/A') {
    return normalized;
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
};

const calculateAgeFromDOB = (dateOfBirth) => {
  if (!dateOfBirth) {
    return 'N/A';
  }

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return 'N/A';
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age >= 0 ? String(age) : 'N/A';
};

const ensurePageSpace = (doc, requiredHeight) => {
  const bottomBuffer = 90;
  if (doc.y + requiredHeight > doc.page.height - bottomBuffer) {
    doc.addPage();
    doc.y = 50;
  }
};

const drawSectionHeader = (doc, title) => {
  ensurePageSpace(doc, 34);

  const y = doc.y;
  const width = doc.page.width - 100;

  doc.roundedRect(50, y, width, 24, 4)
    .fill('#F8FAFC');

  doc.rect(50, y, 4, 24)
    .fill('#2563EB');

  doc.fontSize(11)
    .font('Helvetica-Bold')
    .fillColor('#1F2937')
    .text(title, 62, y + 7, { width: width - 12 });

  doc.y = y + 30;
};

const drawField = (doc, label, value) => {
  ensurePageSpace(doc, 18);

  doc.fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#374151')
    .text(`${label}: `, 50, doc.y, {
      continued: true,
      width: doc.page.width - 100
    })
    .font('Helvetica')
    .fillColor('#111827')
    .text(cleanText(value));

  doc.moveDown(0.25);
};

const drawTextPanel = (doc, text) => {
  const panelWidth = doc.page.width - 100;

  doc.font('Helvetica')
    .fontSize(10)
    .fillColor('#111827');

  const bodyText = cleanText(text);
  const textHeight = doc.heightOfString(bodyText, {
    width: panelWidth - 24,
    align: 'left'
  });

  const panelHeight = Math.max(50, textHeight + 20);
  ensurePageSpace(doc, panelHeight + 8);

  const y = doc.y;
  doc.roundedRect(50, y, panelWidth, panelHeight, 5)
    .fillAndStroke('#FFFFFF', '#D1D5DB');

  doc.fillColor('#111827')
    .text(bodyText, 62, y + 10, {
      width: panelWidth - 24,
      align: 'left'
    });

  doc.y = y + panelHeight + 10;
};

const drawMedicationTable = (doc, medicines) => {
  const tableLeft = 50;
  const tableWidth = doc.page.width - 100;
  const headerHeight = 26;
  const cellPadding = 6;
  const minRowHeight = 24;

  const columns = [
    { label: 'Medicine', width: 0.24 },
    { label: 'Dosage', width: 0.14 },
    { label: 'Frequency', width: 0.15 },
    { label: 'Duration', width: 0.14 },
    { label: 'Instructions', width: 0.33 }
  ].map((column) => ({
    ...column,
    width: tableWidth * column.width
  }));

  const drawHeader = (y) => {
    doc.roundedRect(tableLeft, y, tableWidth, headerHeight, 4)
      .fill('#2563EB');

    doc.fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#FFFFFF');

    let x = tableLeft;
    columns.forEach((column) => {
      doc.text(column.label, x + cellPadding, y + 8, {
        width: column.width - (cellPadding * 2),
        align: 'left'
      });
      x += column.width;
    });
  };

  ensurePageSpace(doc, 70);

  let y = doc.y;
  let tableStartY = y;
  drawHeader(y);
  y += headerHeight;

  const normalizedRows = medicines.length > 0 ? medicines : [{
    name: 'No medicines provided',
    dosage: '-',
    frequency: '-',
    duration: '-',
    instructions: '-'
  }];

  normalizedRows.forEach((medication, rowIndex) => {
    const cells = [
      cleanText(medication.name),
      cleanText(medication.dosage),
      cleanText(medication.frequency),
      cleanText(medication.duration),
      cleanText(medication.instructions, '-')
    ];

    doc.font('Helvetica').fontSize(9).fillColor('#111827');

    const cellHeights = cells.map((cell, index) => doc.heightOfString(cell, {
      width: columns[index].width - (cellPadding * 2),
      align: 'left'
    }));

    const rowHeight = Math.max(
      minRowHeight,
      ...cellHeights.map((height) => height + (cellPadding * 2))
    );

    if (y + rowHeight > doc.page.height - 90) {
      doc.roundedRect(tableLeft, tableStartY, tableWidth, y - tableStartY, 4)
        .stroke('#D1D5DB');

      doc.addPage();
      doc.y = 50;
      y = doc.y;
      tableStartY = y;
      drawHeader(y);
      y += headerHeight;
    }

    if (rowIndex % 2 === 0) {
      doc.rect(tableLeft, y, tableWidth, rowHeight)
        .fill('#F8FAFC');
    }

    let x = tableLeft;
    cells.forEach((cell, index) => {
      doc.fillColor('#111827')
        .text(cell, x + cellPadding, y + cellPadding, {
          width: columns[index].width - (cellPadding * 2),
          align: 'left'
        });

      doc.moveTo(x, y)
        .lineTo(x, y + rowHeight)
        .strokeColor('#E5E7EB')
        .lineWidth(0.5)
        .stroke();

      x += columns[index].width;
    });

    doc.moveTo(tableLeft + tableWidth, y)
      .lineTo(tableLeft + tableWidth, y + rowHeight)
      .strokeColor('#E5E7EB')
      .lineWidth(0.5)
      .stroke();

    doc.moveTo(tableLeft, y + rowHeight)
      .lineTo(tableLeft + tableWidth, y + rowHeight)
      .strokeColor('#E5E7EB')
      .lineWidth(0.5)
      .stroke();

    y += rowHeight;
  });

  doc.roundedRect(tableLeft, tableStartY, tableWidth, y - tableStartY, 4)
    .stroke('#D1D5DB');

  doc.y = y + 10;
};

const formatDateLong = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'N/A';
  }

  return parsed.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatClockTime = (value) => {
  if (typeof value !== 'string') {
    return 'N/A';
  }

  const trimmed = value.trim();
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(trimmed);
  if (!match) {
    return cleanText(trimmed, 'N/A');
  }

  const hour = Number.parseInt(match[1], 10);
  const minute = match[2];
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const normalizedHour = hour % 12 || 12;
  return `${String(normalizedHour).padStart(2, '0')}:${minute} ${suffix}`;
};

const formatTimeSlot = (timeSlot) => {
  if (!timeSlot) {
    return 'N/A';
  }

  if (typeof timeSlot === 'string') {
    return cleanText(timeSlot, 'N/A');
  }

  if (Array.isArray(timeSlot)) {
    const slots = timeSlot
      .map((slot) => formatTimeSlot(slot))
      .filter((slotText) => slotText && slotText !== 'N/A');

    return slots.length > 0 ? slots.join(', ') : 'N/A';
  }

  if (typeof timeSlot === 'object') {
    const startTime = timeSlot.startTime || timeSlot.start;
    const endTime = timeSlot.endTime || timeSlot.end;

    if (startTime && endTime) {
      return `${formatClockTime(startTime)} - ${formatClockTime(endTime)}`;
    }

    if (startTime || endTime) {
      return formatClockTime(startTime || endTime);
    }
  }

  return 'N/A';
};

const humanizeValue = (value, fallback = 'N/A') => {
  const normalized = cleanText(value, fallback);
  if (normalized === fallback) {
    return normalized;
  }

  return normalized
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Generate Prescription PDF
 */
export const generatePrescriptionPDF = async (prescription, patient, doctor) => {
  try {
    const doc = pdfService.createDocument();

    // Header
    pdfService.addHeader(doc, 'Medical Prescription', {
      subtitle: 'Clinical document generated by CareQueue',
      contactLines: [
        'Phone: +91-XXX-XXX-XXXX',
        'Email: info@carequeue.com',
        'Web: www.carequeue.com'
      ]
    });

    const panelWidth = doc.page.width - 100;
    const issueDate = new Date(prescription.createdAt || Date.now());
    const validUntilDate = prescription.validUntil ? new Date(prescription.validUntil) : null;
    const panelY = doc.y;

    doc.roundedRect(50, panelY, panelWidth, 46, 6)
      .fillAndStroke('#EFF6FF', '#BFDBFE');

    doc.fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#1E3A8A')
      .text(`Prescription No: ${cleanText(prescription.prescriptionNumber)}`, 64, panelY + 11, {
        width: panelWidth - 20,
        align: 'left'
      });

    doc.fontSize(9)
      .font('Helvetica')
      .fillColor('#334155')
      .text(`Issued: ${issueDate.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`, 64, panelY + 28, {
        width: panelWidth - 20,
        align: 'left'
      });

    doc.fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#334155')
      .text(
        `Valid Until: ${validUntilDate ? validUntilDate.toLocaleDateString('en-IN') : 'N/A'}`,
        50,
        panelY + 11,
        {
          width: panelWidth - 14,
          align: 'right'
        }
      );

    doc.y = panelY + 58;

    // Patient Information
    drawSectionHeader(doc, 'Patient Information');

    const patientInfo = patient.personalInfo || {};
    const patientAge = calculateAgeFromDOB(patientInfo.dateOfBirth);
    drawField(doc, 'Name', `${patientInfo.firstName || ''} ${patientInfo.lastName || ''}`.trim());
    drawField(doc, 'Age / Gender', `${patientAge} years / ${toTitleCase(patientInfo.gender)}`);
    drawField(doc, 'Contact', patient.phoneNumber || patient.email);

    doc.moveDown(0.6);

    // Doctor Information
    drawSectionHeader(doc, 'Prescribed By');

    const doctorInfo = doctor.personalInfo || {};
    const professionalInfo = doctor.professionalInfo || {};
    drawField(doc, 'Doctor', `Dr. ${doctorInfo.firstName || ''} ${doctorInfo.lastName || ''}`.trim());
    drawField(doc, 'Specialty', professionalInfo.specialty || 'General Physician');
    drawField(doc, 'License No', professionalInfo.licenseNumber || 'N/A');

    doc.moveDown(0.6);

    // Diagnosis
    drawSectionHeader(doc, 'Diagnosis');
    drawTextPanel(doc, prescription.diagnosis);

    // Medicines Table
    drawSectionHeader(doc, 'Medications');
    drawMedicationTable(doc, Array.isArray(prescription.medicines) ? prescription.medicines : []);

    doc.moveDown(0.6);

    // Additional Instructions
    const generalNotes = prescription.notes || prescription.instructions;
    if (generalNotes) {
      drawSectionHeader(doc, 'General Instructions');
      drawTextPanel(doc, generalNotes);
      doc.moveDown(0.4);
    }

    // Recommended Tests
    if (prescription.tests && prescription.tests.length > 0) {
      drawSectionHeader(doc, 'Recommended Tests');

      prescription.tests.forEach((test, index) => {
        ensurePageSpace(doc, 16);
        doc.fontSize(10)
          .font('Helvetica')
          .fillColor('#111827')
          .text(`${index + 1}. ${cleanText(test)}`, 50, doc.y, {
            width: doc.page.width - 100
          });
        doc.moveDown(0.2);
      });

      doc.moveDown(0.4);
    }

    // Follow-up
    if (prescription.followUpDate) {
      drawSectionHeader(doc, 'Follow-up');

      const followUpDate = new Date(prescription.followUpDate);
      const followUpText = Number.isNaN(followUpDate.getTime())
        ? 'N/A'
        : followUpDate.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

      drawField(doc, 'Follow-up Date', followUpText);
      if (prescription.followUpInstructions) {
        drawField(doc, 'Instructions', prescription.followUpInstructions);
      }
      doc.moveDown(0.4);
    }

    // Signature block
    ensurePageSpace(doc, 110);
    const signatureWidth = 240;
    const signatureHeight = 92;
    const signatureX = doc.page.width - 50 - signatureWidth;
    const signatureY = doc.y + 8;

    doc.roundedRect(signatureX, signatureY, signatureWidth, signatureHeight, 6)
      .fillAndStroke('#F8FAFC', '#D1D5DB');

    doc.moveTo(signatureX + 15, signatureY + 42)
      .lineTo(signatureX + signatureWidth - 15, signatureY + 42)
      .strokeColor('#6B7280')
      .stroke();

    doc.fontSize(8)
      .font('Helvetica')
      .fillColor('#6B7280')
      .text('Doctor Signature (Digital)', signatureX + 15, signatureY + 46, {
        width: signatureWidth - 30
      });

    doc.fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#111827')
      .text(`Dr. ${cleanText(`${doctorInfo.firstName || ''} ${doctorInfo.lastName || ''}`.trim())}`, signatureX + 15, signatureY + 60, {
        width: signatureWidth - 30
      });

    doc.fontSize(8.5)
      .font('Helvetica')
      .fillColor('#374151')
      .text(`Specialty: ${cleanText(professionalInfo.specialty || 'General Physician')}`, signatureX + 15, signatureY + 75, {
        width: signatureWidth - 30
      })
      .text(`Reg No: ${cleanText(professionalInfo.licenseNumber || 'N/A')}`, signatureX + 15, signatureY + 86, {
        width: signatureWidth - 30
      });

    doc.y = signatureY + signatureHeight + 8;

    // Disclaimer
    ensurePageSpace(doc, 72);
    const disclaimerY = doc.y;
    const disclaimerText = 'This prescription is valid for 30 days from the issue date. Do not self-medicate. Follow dosage and duration exactly as prescribed. Contact your doctor immediately if adverse reactions occur. This is a digitally generated clinical prescription.';

    doc.roundedRect(50, disclaimerY, panelWidth, 60, 6)
      .fillAndStroke('#FFF7ED', '#FED7AA');

    doc.fontSize(8.5)
      .font('Helvetica')
      .fillColor('#7C2D12')
      .text(disclaimerText, 62, disclaimerY + 10, {
        width: panelWidth - 24,
        align: 'left'
      });

    doc.y = disclaimerY + 68;

    // Add watermark
    pdfService.addWatermark(doc, 'PRESCRIPTION');

    // Add footer
    pdfService.addFooter(doc);

    // Finalize PDF
    return await pdfService.finalizePDF(doc);

  } catch (error) {
    logger.error('Error generating prescription PDF:', error);
    throw new Error('Failed to generate prescription PDF');
  }
};

/**
 * Generate Medical Record PDF
 */
export const generateMedicalRecordPDF = async (record, patient, uploader) => {
  try {
    const doc = pdfService.createDocument();
    
    // Add header
    pdfService.addHeader(doc, 'Medical Record Report');
    
    // Record title and date
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#1F2937')
       .text(record.title, { align: 'center' })
       .fontSize(10)
       .fillColor('#6B7280')
       .font('Helvetica')
       .text(`Record Date: ${new Date(record.recordDate).toLocaleDateString('en-IN')}`, { align: 'center' })
       .moveDown(1.5);
    
    // Patient Information
    pdfService.addSectionTitle(doc, 'Patient Information');
    
    const patientInfo = patient.personalInfo || {};
    pdfService.addKeyValue(doc, 'Patient Name', `${patientInfo.firstName || ''} ${patientInfo.lastName || ''}`.trim());
    pdfService.addKeyValue(doc, 'Age / Gender', `${patientInfo.age || 'N/A'} years / ${patientInfo.gender || 'N/A'}`);
    pdfService.addKeyValue(doc, 'Contact', patient.phone || patient.email);
    pdfService.addKeyValue(doc, 'Patient ID', patient._id.toString().slice(-8).toUpperCase());
    
    doc.moveDown(1);
    
    // Record Details
    pdfService.addSectionTitle(doc, 'Record Details');
    
    pdfService.addKeyValue(doc, 'Record Type', record.recordType.replace(/-/g, ' ').toUpperCase());
    pdfService.addKeyValue(doc, 'Uploaded By', uploader ? `${uploader.personalInfo?.firstName || ''} ${uploader.personalInfo?.lastName || ''}`.trim() : 'System');
    pdfService.addKeyValue(doc, 'Upload Date', new Date(record.createdAt).toLocaleDateString('en-IN'));
    pdfService.addKeyValue(doc, 'Status', record.status.toUpperCase());
    
    doc.moveDown(1);
    
    // Description
    if (record.description) {
      pdfService.addSectionTitle(doc, 'Description');
      doc.fontSize(10)
         .fillColor('#000000')
         .text(record.description, { align: 'justify' })
         .moveDown(1);
    }
    
    // Metadata
    if (record.metadata) {
      pdfService.addSectionTitle(doc, 'Additional Information');
      
      if (record.metadata.hospital) pdfService.addKeyValue(doc, 'Hospital/Clinic', record.metadata.hospital);
      if (record.metadata.doctorName) pdfService.addKeyValue(doc, 'Doctor', record.metadata.doctorName);
      if (record.metadata.department) pdfService.addKeyValue(doc, 'Department', record.metadata.department);
      if (record.metadata.diagnosis) pdfService.addKeyValue(doc, 'Diagnosis', record.metadata.diagnosis);
      
      if (record.metadata.tags && record.metadata.tags.length > 0) {
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor('#374151')
           .text('Tags: ', { continued: true })
           .font('Helvetica')
           .fillColor('#3B82F6')
           .text(record.metadata.tags.join(', '));
        doc.moveDown(0.5);
      }
    }
    
    doc.moveDown(1);
    
    // Files Information
    if (record.files && record.files.length > 0) {
      pdfService.addSectionTitle(doc, 'Attached Files');
      
      const headers = ['#', 'File Name', 'Type', 'Size', 'Upload Date'];
      const rows = record.files.map((file, index) => [
        (index + 1).toString(),
        file.fileName || 'Unknown',
        file.fileType || 'N/A',
        `${(file.fileSize / 1024).toFixed(2)} KB`,
        new Date(file.uploadedAt || record.createdAt).toLocaleDateString('en-IN')
      ]);
      
      pdfService.addTable(doc, headers, rows);
      
      doc.moveDown(1);
    }
    
    // Sharing Information
    if (record.sharedWith && record.sharedWith.length > 0) {
      pdfService.addSectionTitle(doc, 'Shared With');
      
      record.sharedWith.forEach((share, index) => {
        const doctorName = share.doctor?.personalInfo
          ? `Dr. ${share.doctor.personalInfo.firstName} ${share.doctor.personalInfo.lastName}`
          : 'Doctor';
        
        doc.fontSize(9)
           .fillColor('#000000')
           .text(`${index + 1}. ${doctorName}`, { continued: true })
           .fillColor('#6B7280')
           .text(` (Shared on ${new Date(share.sharedAt).toLocaleDateString('en-IN')})`);
      });
      
      doc.moveDown(1);
    }
    
    // Access Log Summary
    if (record.accessLog && record.accessLog.length > 0) {
      pdfService.addSectionTitle(doc, 'Access History Summary');
      
      doc.fontSize(9)
         .fillColor('#6B7280')
         .text(`Total Access Count: ${record.accessLog.length}`)
         .text(`Last Accessed: ${new Date(record.accessLog[record.accessLog.length - 1].timestamp).toLocaleDateString('en-IN')}`)
         .moveDown(1);
    }
    
    // QR Code for record
    doc.x = 50;
    doc.fontSize(9).fillColor('#6B7280').text('Scan QR Code to view record online:', 50, doc.y);
    const qrY = doc.y + 5;
    await pdfService.addQRCode(doc, `${process.env.FRONTEND_URL || 'https://carequeue.com'}/records/${record._id}`, 50, qrY, 80);
    doc.y = qrY + 90;
    doc.moveDown(1);
    
    // Disclaimer
    pdfService.addDisclaimer(
      doc,
      'This is a confidential medical record. Unauthorized access, disclosure, or copying is strictly prohibited. This document is for medical purposes only and should be handled in accordance with HIPAA and applicable privacy regulations.'
    );
    
    // Add watermark
    pdfService.addWatermark(doc, 'CONFIDENTIAL');
    
    // Add footer
    pdfService.addFooter(doc);
    
    // Finalize PDF
    return await pdfService.finalizePDF(doc);
    
  } catch (error) {
    logger.error('Error generating medical record PDF:', error);
    throw new Error('Failed to generate medical record PDF');
  }
};

/**
 * Generate Appointment Confirmation PDF
 */
export const generateAppointmentPDF = async (appointment, patient, doctor) => {
  try {
    const doc = pdfService.createDocument();
    const panelWidth = doc.page.width - 100;
    const confirmationNo = appointment._id?.toString().slice(-8).toUpperCase() || 'N/A';
    const patientInfo = patient.personalInfo || {};
    const doctorInfo = doctor.personalInfo || {};
    const professionalInfo = doctor.professionalInfo || {};
    const appointmentType = appointment.type || appointment.appointmentType;
    const reasonForVisit = appointment.reasonForVisit || appointment.reason || appointment.notes;
    const appointmentDate = formatDateLong(appointment.appointmentDate);
    const appointmentTime = formatTimeSlot(appointment.timeSlot);

    // Add header
    pdfService.addHeader(doc, 'Appointment Confirmation', {
      subtitle: 'Please carry this document for clinic check-in',
      contactLines: [
        'Phone: +91-XXX-XXX-XXXX',
        'Email: info@carequeue.com',
        'Web: www.carequeue.com'
      ]
    });

    const bannerY = doc.y;
    doc.roundedRect(50, bannerY, panelWidth, 54, 6)
      .fillAndStroke('#ECFDF5', '#A7F3D0');

    doc.fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#047857')
      .text('Appointment Confirmed', 50, bannerY + 12, {
        align: 'center',
        width: panelWidth
      });

    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#065F46')
      .text(`Confirmation No: ${confirmationNo}`, 50, bannerY + 33, {
        align: 'center',
        width: panelWidth
      });

    doc.y = bannerY + 66;

    drawSectionHeader(doc, 'Appointment Details');
    drawField(doc, 'Date', appointmentDate);
    drawField(doc, 'Time', appointmentTime);
    drawField(doc, 'Status', humanizeValue(appointment.status || 'scheduled'));
    drawField(doc, 'Type', humanizeValue(appointmentType || 'consultation'));

    if (reasonForVisit) {
      drawField(doc, 'Reason for Visit', cleanText(reasonForVisit));
    }

    doc.moveDown(0.4);

    drawSectionHeader(doc, 'Patient Information');
    drawField(doc, 'Name', `${patientInfo.firstName || ''} ${patientInfo.lastName || ''}`.trim());
    drawField(doc, 'Contact', patient.phoneNumber || patient.phone || patient.email);
    drawField(doc, 'Email', patient.email);

    doc.moveDown(0.4);

    drawSectionHeader(doc, 'Doctor Information');
    drawField(doc, 'Doctor', `Dr. ${doctorInfo.firstName || ''} ${doctorInfo.lastName || ''}`.trim());
    drawField(doc, 'Specialty', professionalInfo.specialty || professionalInfo.specialization || 'General Physician');
    drawField(doc, 'Contact', doctor.phoneNumber || doctor.phone || doctor.email || 'N/A');

    doc.moveDown(0.6);

    ensurePageSpace(doc, 186);
    const cardY = doc.y;
    const qrCardWidth = 198;
    const cardGap = 16;
    const instructionsCardX = 50 + qrCardWidth + cardGap;
    const instructionsCardWidth = panelWidth - qrCardWidth - cardGap;
    const cardHeight = 154;

    doc.roundedRect(50, cardY, qrCardWidth, cardHeight, 6)
      .fillAndStroke('#F8FAFC', '#D1D5DB');

    doc.fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#1F2937')
      .text('Clinic Check-in QR', 62, cardY + 12, {
        width: qrCardWidth - 24,
        align: 'left'
      });

    await pdfService.addQRCode(
      doc,
      JSON.stringify({
        id: appointment._id,
        patient: patient._id,
        doctor: doctor._id,
        date: appointment.appointmentDate,
        slot: appointment.timeSlot
      }),
      99,
      cardY + 31,
      100
    );

    doc.fontSize(8)
      .font('Helvetica')
      .fillColor('#6B7280')
      .text('Present this code at reception.', 62, cardY + 135, {
        width: qrCardWidth - 24,
        align: 'center'
      });

    doc.roundedRect(instructionsCardX, cardY, instructionsCardWidth, cardHeight, 6)
      .fillAndStroke('#EFF6FF', '#BFDBFE');

    doc.fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#1F2937')
      .text('Important Instructions', instructionsCardX + 12, cardY + 12, {
        width: instructionsCardWidth - 24,
        align: 'left'
      });

    const instructions = [
      'Please arrive at least 10 minutes early.',
      'Bring a valid photo ID and insurance card.',
      'Carry previous prescriptions or medical reports.',
      'If delayed, call the clinic before your slot starts.'
    ];

    let instructionY = cardY + 34;
    instructions.forEach((instruction) => {
      const line = `- ${instruction}`;
      const lineHeight = doc.heightOfString(line, {
        width: instructionsCardWidth - 24,
        align: 'left'
      });

      doc.fontSize(9)
        .font('Helvetica')
        .fillColor('#334155')
        .text(line, instructionsCardX + 12, instructionY, {
          width: instructionsCardWidth - 24,
          align: 'left'
        });

      instructionY += lineHeight + 4;
    });

    doc.y = cardY + cardHeight + 10;

    ensurePageSpace(doc, 72);
    const policyY = doc.y;
    doc.roundedRect(50, policyY, panelWidth, 60, 6)
      .fillAndStroke('#FFF7ED', '#FED7AA');

    doc.fontSize(8.5)
      .font('Helvetica')
      .fillColor('#7C2D12')
      .text(
        'Cancellation policy: Please cancel or reschedule at least 24 hours in advance to avoid cancellation charges. For assistance, contact +91-XXX-XXX-XXXX or info@carequeue.com.',
        62,
        policyY + 10,
        {
          width: panelWidth - 24,
          align: 'left'
        }
      );

    doc.y = policyY + 68;
    
    // Add footer
    pdfService.addFooter(doc);
    
    // Finalize PDF
    return await pdfService.finalizePDF(doc);
    
  } catch (error) {
    logger.error('Error generating appointment PDF:', error);
    throw new Error('Failed to generate appointment PDF');
  }
};

/**
 * Generate Invoice/Receipt PDF (for future payment integration)
 */
export const generateInvoicePDF = async (invoice) => {
  try {
    const doc = pdfService.createDocument();
    
    // Add header
    pdfService.addHeader(doc, 'Payment Invoice');
    
    // Invoice details
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#1F2937')
       .text(`Invoice #${invoice.invoiceNumber || 'INV-XXXX'}`, 50, doc.y, { align: 'left' })
       .text(`Date: ${new Date(invoice.date || Date.now()).toLocaleDateString('en-IN')}`, { align: 'right' });
    
    doc.moveDown(1.5);
    
    // Bill To
    pdfService.addSectionTitle(doc, 'Bill To');
    pdfService.addKeyValue(doc, 'Patient Name', invoice.patientName);
    pdfService.addKeyValue(doc, 'Contact', invoice.patientContact);
    
    doc.moveDown(1);
    
    // Itemized charges
    pdfService.addSectionTitle(doc, 'Charges');
    
    const headers = ['Description', 'Quantity', 'Rate', 'Amount'];
    const rows = invoice.items?.map(item => [
      item.description,
      item.quantity.toString(),
      `₹${item.rate.toFixed(2)}`,
      `₹${(item.quantity * item.rate).toFixed(2)}`
    ]) || [];
    
    pdfService.addTable(doc, headers, rows);
    
    // Total
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#1F2937')
       .text(`Total Amount: ₹${invoice.totalAmount?.toFixed(2) || '0.00'}`, { align: 'right' })
       .moveDown(1);
    
    // Payment status
    doc.fontSize(10)
       .fillColor(invoice.paymentStatus === 'paid' ? '#10B981' : '#EF4444')
       .text(`Payment Status: ${(invoice.paymentStatus || 'pending').toUpperCase()}`, { align: 'right' });
    
    // Add footer
    pdfService.addFooter(doc);
    
    return await pdfService.finalizePDF(doc);
    
  } catch (error) {
    logger.error('Error generating invoice PDF:', error);
    throw new Error('Failed to generate invoice PDF');
  }
};
