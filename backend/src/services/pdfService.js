import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { logger } from '../utils/logger.js';

/**
 * PDF Generation Service
 * Creates professional PDFs for prescriptions, reports, invoices, and appointments
 */
class PDFService {
  /**
   * Create a new PDF document with default settings
   */
  createDocument() {
    return new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true
    });
  }

  /**
   * Add clinic header to PDF
   */
  addHeader(doc, title = 'CareQueue Health Services') {
    const pageWidth = doc.page.width;
    
    // Header background
    doc.rect(0, 0, pageWidth, 100)
       .fill('#3B82F6');
    
    // Clinic name
    doc.fontSize(24)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text(title, 50, 30, { align: 'left' });
    
    // Tagline
    doc.fontSize(10)
       .fillColor('#E5E7EB')
       .font('Helvetica')
       .text('Quality Healthcare at Your Fingertips', 50, 60);
    
    // Contact info (right side)
    doc.fontSize(9)
       .fillColor('#FFFFFF')
       .text('📞 +91-XXX-XXX-XXXX', pageWidth - 200, 35, { align: 'right' })
       .text('📧 info@carequeue.com', pageWidth - 200, 50, { align: 'right' })
       .text('🌐 www.carequeue.com', pageWidth - 200, 65, { align: 'right' });
    
    // Reset position and color
    doc.fillColor('#000000');
    doc.y = 120;
    
    return doc;
  }

  /**
   * Add footer with page numbers
   */
  addFooter(doc) {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      // Footer line
      doc.moveTo(50, doc.page.height - 50)
         .lineTo(doc.page.width - 50, doc.page.height - 50)
         .strokeColor('#E5E7EB')
         .stroke();
      
      // Footer text
      doc.fontSize(8)
         .fillColor('#6B7280')
         .text(
           `Page ${i + 1} of ${pageCount} | Generated on ${new Date().toLocaleDateString('en-IN')} | CareQueue Health Services`,
           50,
           doc.page.height - 40,
           { align: 'center', width: doc.page.width - 100 }
         );
    }
    
    return doc;
  }

  /**
   * Add section title
   */
  addSectionTitle(doc, title, y = null) {
    if (y) doc.y = y;
    
    doc.fontSize(14)
       .fillColor('#1F2937')
       .font('Helvetica-Bold')
       .text(title, { underline: true })
       .moveDown(0.5);
    
    doc.font('Helvetica').fillColor('#000000');
    
    return doc;
  }

  /**
   * Add key-value pair
   */
  addKeyValue(doc, key, value, inline = false) {
    if (inline) {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text(key + ': ', { continued: true })
         .font('Helvetica')
         .fillColor('#000000')
         .text(value || 'N/A');
    } else {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text(key)
         .font('Helvetica')
         .fillColor('#000000')
         .text(value || 'N/A')
         .moveDown(0.3);
    }
    
    return doc;
  }

  /**
   * Add table to PDF
   */
  addTable(doc, headers, rows, startY = null) {
    if (startY) doc.y = startY;
    
    const tableTop = doc.y;
    const colWidth = (doc.page.width - 100) / headers.length;
    let currentY = tableTop;

    // Table header
    doc.rect(50, currentY, doc.page.width - 100, 25)
       .fillAndStroke('#3B82F6', '#3B82F6');
    
    doc.fontSize(10)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold');
    
    headers.forEach((header, i) => {
      doc.text(header, 55 + (i * colWidth), currentY + 7, {
        width: colWidth - 10,
        align: 'left'
      });
    });
    
    currentY += 25;
    
    // Table rows
    doc.font('Helvetica')
       .fillColor('#000000')
       .fontSize(9);
    
    rows.forEach((row, rowIndex) => {
      // Alternate row colors
      if (rowIndex % 2 === 0) {
        doc.rect(50, currentY, doc.page.width - 100, 20)
           .fill('#F9FAFB');
      }
      
      row.forEach((cell, colIndex) => {
        doc.fillColor('#000000')
           .text(cell || '', 55 + (colIndex * colWidth), currentY + 5, {
             width: colWidth - 10,
             align: 'left'
           });
      });
      
      currentY += 20;
      
      // Check if we need a new page
      if (currentY > doc.page.height - 100) {
        doc.addPage();
        currentY = 50;
      }
    });
    
    // Table border
    doc.rect(50, tableTop, doc.page.width - 100, currentY - tableTop)
       .stroke('#E5E7EB');
    
    doc.y = currentY + 10;
    
    return doc;
  }

  /**
   * Add signature section
   */
  addSignature(doc, signerName, signerRole, date = new Date()) {
    const startY = doc.y + 30;
    
    // Signature line
    doc.moveTo(doc.page.width - 250, startY)
       .lineTo(doc.page.width - 50, startY)
       .stroke('#000000');
    
    // Signer info
    doc.fontSize(10)
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text(signerName, doc.page.width - 250, startY + 10, { align: 'left' })
       .font('Helvetica')
       .fontSize(9)
       .fillColor('#6B7280')
       .text(signerRole, doc.page.width - 250, startY + 25, { align: 'left' })
       .text(date.toLocaleDateString('en-IN'), doc.page.width - 250, startY + 40, { align: 'left' });
    
    return doc;
  }

  /**
   * Add QR code to PDF
   */
  async addQRCode(doc, data, x, y, size = 100) {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(data, {
        width: size,
        margin: 1
      });
      
      // Convert data URL to buffer
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      doc.image(buffer, x, y, { width: size, height: size });
      
    } catch (error) {
      logger.error('Error generating QR code:', error);
      doc.fontSize(8)
         .text('QR Code unavailable', x, y + size / 2);
    }
    
    return doc;
  }

  /**
   * Add watermark to PDF
   */
  addWatermark(doc, text = 'CONFIDENTIAL') {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      doc.save();
      doc.rotate(45, { origin: [doc.page.width / 2, doc.page.height / 2] });
      doc.fontSize(60)
         .fillColor('#F3F4F6', 0.1)
         .font('Helvetica-Bold')
         .text(text, 0, doc.page.height / 2, {
           align: 'center',
           width: doc.page.width
         });
      doc.restore();
    }
    
    return doc;
  }

  /**
   * Add disclaimer/terms
   */
  addDisclaimer(doc, text) {
    doc.fontSize(7)
       .fillColor('#9CA3AF')
       .text(text, 50, doc.y + 10, {
         width: doc.page.width - 100,
         align: 'justify'
       });
    
    return doc;
  }

  /**
   * Finalize PDF and return as buffer
   */
  async finalizePDF(doc) {
    return new Promise((resolve, reject) => {
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      
      doc.end();
    });
  }
}

export default new PDFService();
