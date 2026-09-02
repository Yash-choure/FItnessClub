const PDFDocument = require('pdfkit');

function streamReceiptPDF(res, payment, member, plan) {
  const doc = new PDFDocument({ size: 'A5', margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${payment.receiptNo}.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).text('Fitness Club — Payment Receipt', { align: 'center' });
  doc.moveDown();
  doc.fontSize(11).text(`Receipt No: ${payment.receiptNo}`);
  doc.text(`Date: ${new Date(payment.paidOn).toLocaleString('en-IN')}`);
  doc.moveDown();
  doc.text(`Member: ${member.fullName}`);
  doc.text(`Plan: ${plan.name}`);
  doc.text(`Duration: ${plan.durationDays} days`);
  doc.text(`Amount: Rs. ${Number(payment.amount).toFixed(2)}`);
  doc.text(`Mode: ${String(payment.mode).toUpperCase()}`);
  doc.moveDown();
  doc.text('Thank you for your payment.', { align: 'center' });
  doc.end();
}

module.exports = { streamReceiptPDF };
