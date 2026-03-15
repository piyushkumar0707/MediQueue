import pdfService from './pdfService.js';
import { logger } from '../utils/logger.js';

/**
 * Generate Prescription PDF
 */
export const generatePrescriptionPDF = async (prescription, patient, doctor) => {
  try {
    const doc = pdfService.createDocument();
    
    // Add header
    pdfService.addHeader(doc, 'Medical Prescription');
    
    // Prescription number and date
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#3B82F6')
       .text(`Rx #${prescription.prescriptionNumber}`, 50, doc.y, { align: 'left' })
       .fontSize(10)
       .fillColor('#6B7280')
       .text(new Date(prescription.createdAt).toLocaleDateString('en-IN', {
         year: 'numeric',
         month: 'long',
         day: 'numeric'
       }), { align: 'right' });
    
    doc.moveDown(1.5);
    
    // Patient Information
    pdfService.addSectionTitle(doc, 'Patient Information');
    
    const patientInfo = patient.personalInfo || {};
    pdfService.addKeyValue(doc, 'Name', `${patientInfo.firstName || ''} ${patientInfo.lastName || ''}`.trim(), true);
    pdfService.addKeyValue(doc, 'Age/Gender', `${patientInfo.age || 'N/A'} years / ${patientInfo.gender || 'N/A'}`, true);
    pdfService.addKeyValue(doc, 'Contact', patient.phone || patient.email, true);
    
    doc.moveDown(1);
    
    // Doctor Information
    pdfService.addSectionTitle(doc, 'Prescribed By');
    
    const doctorInfo = doctor.personalInfo || {};
    const professionalInfo = doctor.professionalInfo || {};
    pdfService.addKeyValue(doc, 'Doctor', `Dr. ${doctorInfo.firstName || ''} ${doctorInfo.lastName || ''}`.trim(), true);
    pdfService.addKeyValue(doc, 'Specialization', professionalInfo.specialization || 'General Physician', true);
    pdfService.addKeyValue(doc, 'License No', professionalInfo.licenseNumber || 'N/A', true);
    
    doc.moveDown(1);
    
    // Diagnosis
    if (prescription.diagnosis) {
      pdfService.addSectionTitle(doc, 'Diagnosis');
      doc.fontSize(10)
         .fillColor('#000000')
         .text(prescription.diagnosis)
         .moveDown(1);
    }
    
    // Medicines Table
    pdfService.addSectionTitle(doc, 'Medications');
    
    const headers = ['Medicine', 'Dosage', 'Frequency', 'Duration', 'Instructions'];
    const rows = prescription.medicines.map(med => [
      med.name || '',
      med.dosage || '',
      med.frequency || '',
      med.duration || '',
      med.instructions || ''
    ]);
    
    pdfService.addTable(doc, headers, rows);
    
    doc.moveDown(1);
    
    // Additional Instructions
    if (prescription.instructions) {
      pdfService.addSectionTitle(doc, 'General Instructions');
      doc.fontSize(10)
         .fillColor('#000000')
         .text(prescription.instructions, { align: 'justify' })
         .moveDown(1);
    }
    
    // Follow-up
    if (prescription.followUpDate) {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#DC2626')
         .text(`📅 Follow-up Date: ${new Date(prescription.followUpDate).toLocaleDateString('en-IN')}`)
         .moveDown(1);
    }
    
    // Doctor's signature
    pdfService.addSignature(
      doc,
      `Dr. ${doctorInfo.firstName || ''} ${doctorInfo.lastName || ''}`,
      professionalInfo.specialization || 'Medical Practitioner',
      new Date(prescription.createdAt)
    );
    
    // Disclaimer
    pdfService.addDisclaimer(
      doc,
      'This prescription is valid for 30 days from the date of issue. Do not self-medicate. Follow the prescribed dosage and duration. Consult your doctor if you experience any adverse effects. This is a computer-generated prescription and does not require a physical signature.'
    );
    
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
    
    // Add header
    pdfService.addHeader(doc, 'Appointment Confirmation');
    
    // Confirmation message
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#10B981')
       .text('✓ Appointment Confirmed', { align: 'center' })
       .moveDown(0.5);
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#6B7280')
       .text(`Confirmation No: ${appointment._id.toString().slice(-8).toUpperCase()}`, { align: 'center' })
       .moveDown(2);
    
    // Appointment Details
    pdfService.addSectionTitle(doc, 'Appointment Details');
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#1F2937')
       .text('📅 Date & Time', 50, doc.y)
       .fontSize(14)
       .fillColor('#3B82F6')
       .text(new Date(appointment.appointmentDate).toLocaleDateString('en-IN', {
         weekday: 'long',
         year: 'numeric',
         month: 'long',
         day: 'numeric'
       }))
       .text(`⏰ ${appointment.timeSlot}`)
       .moveDown(1);
    
    // Patient Information
    pdfService.addSectionTitle(doc, 'Patient Information');
    
    const patientInfo = patient.personalInfo || {};
    pdfService.addKeyValue(doc, 'Name', `${patientInfo.firstName || ''} ${patientInfo.lastName || ''}`.trim());
    pdfService.addKeyValue(doc, 'Contact', patient.phone || patient.email);
    
    doc.moveDown(1);
    
    // Doctor Information
    pdfService.addSectionTitle(doc, 'Doctor Information');
    
    const doctorInfo = doctor.personalInfo || {};
    const professionalInfo = doctor.professionalInfo || {};
    
    pdfService.addKeyValue(doc, 'Doctor', `Dr. ${doctorInfo.firstName || ''} ${doctorInfo.lastName || ''}`.trim());
    pdfService.addKeyValue(doc, 'Specialization', professionalInfo.specialization || 'General Physician');
    if (doctor.phone) pdfService.addKeyValue(doc, 'Contact', doctor.phone);
    
    doc.moveDown(1);
    
    // Appointment Type & Status
    if (appointment.appointmentType) {
      pdfService.addKeyValue(doc, 'Appointment Type', appointment.appointmentType.replace(/-/g, ' ').toUpperCase());
    }
    pdfService.addKeyValue(doc, 'Status', appointment.status.toUpperCase());
    
    if (appointment.reason) {
      doc.moveDown(0.5);
      pdfService.addKeyValue(doc, 'Reason for Visit', appointment.reason);
    }
    
    doc.moveDown(2);
    
    // QR Code
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor('#1F2937')
       .text('Scan QR Code at Clinic:', 50, doc.y);
    
    await pdfService.addQRCode(
      doc,
      JSON.stringify({
        id: appointment._id,
        patient: patient._id,
        doctor: doctor._id,
        date: appointment.appointmentDate,
        slot: appointment.timeSlot
      }),
      50,
      doc.y + 10,
      100
    );
    
    // Instructions box
    doc.rect(180, doc.y - 110, doc.page.width - 230, 100)
       .fillAndStroke('#EFF6FF', '#3B82F6');
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#1F2937')
       .text('📋 Important Instructions', 190, doc.y - 100)
       .font('Helvetica')
       .fontSize(9)
       .fillColor('#374151')
       .text('• Please arrive 10 minutes early', 190, doc.y - 80)
       .text('• Bring your ID and insurance card', 190, doc.y - 65)
       .text('• Carry previous medical reports', 190, doc.y - 50)
       .text('• Wear a mask at all times', 190, doc.y - 35);
    
    doc.y += 20;
    doc.moveDown(2);
    
    // Cancellation Policy
    pdfService.addDisclaimer(
      doc,
      'Cancellation Policy: Please cancel at least 24 hours in advance to avoid cancellation charges. For any queries or to reschedule, contact us at +91-XXX-XXX-XXXX or email info@carequeue.com. Thank you for choosing CareQueue Health Services!'
    );
    
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
