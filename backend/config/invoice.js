const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const Order = require('../model/orderSchema');

const generateInvoicePDF = async (order) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));
  
  // Ensure safe values
  const originalAmount = order.originalAmount || 0;
  const currentAmount = order.currentAmount || 0;
  const couponDiscount = order.couponApplied?.discountAmount || 0;

  // Invoice Header
  doc.fontSize(20).text('TAX INVOICE', { align: 'right' }).moveDown();
  doc.fontSize(10)
     .text('Your Company Name', 50, 100)
     .text('Company Address', 50, 115)
     .text('GSTIN: XXXXXXXXXXXXX', 50, 130)
     .text('Invoice Date: ' + new Date().toLocaleDateString(), 400, 100)
     .text('Invoice No: ' + (order.orderId || 'N/A'), 400, 115);

  // Customer Details
  doc.text('Billing To:', 50, 180)
     .text(order.user?.name || 'Customer', 50, 195)
     .text(order.shippingAddress?.full_name || 'N/A', 50, 210)
     .text(order.shippingAddress?.street_address || 'N/A', 50, 225)
     .text(`${order.shippingAddress?.city || 'N/A'}, ${order.shippingAddress?.state || 'N/A'}`, 50, 240);

  // Invoice Table
  const invoiceTableTop = 280;
  doc.font('Helvetica-Bold')
     .text('Product', 50, invoiceTableTop)
     .text('Quantity', 250, invoiceTableTop)
     .text('Unit Price', 350, invoiceTableTop)
     .text('Total', 450, invoiceTableTop);

  doc.font('Helvetica');
  let position = invoiceTableTop + 20;
  
  // Safe item iteration
  (order.items || []).forEach(item => {
    doc.text(item.product?.name || 'Unknown Product', 50, position)
       .text((item.quantity || 0).toString(), 250, position)
       .text(`₹${(item.price || 0).toFixed(2)}`, 350, position)
       .text(`₹${((item.quantity || 0) * (item.price || 0)).toFixed(2)}`, 450, position);
    position += 20;
  });

  // Totals Section
  position += 30;
  doc.text('Subtotal', 350, position)
     .text(`₹${originalAmount.toFixed(2)}`, 450, position);
  
  if (couponDiscount > 0) {
    position += 20;
    doc.text('Coupon Discount', 350, position)
       .text(`-₹${couponDiscount.toFixed(2)}`, 450, position);
  }

  doc.font('Helvetica-Bold')
     .text('Total', 350, position + 20)
     .text(`₹${currentAmount.toFixed(2)}`, 450, position + 20);

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
    doc.on('error', reject);
  });
};

const downloadInvoice = async (req, res) => {
    try {
      console.log('Order ID Requested:', req.params.orderId);
  
      const order = await Order.findById(req.params.orderId)
        .populate('user')
        .populate('items.product')
        .populate('shippingAddress');
  
      console.log('Order Found:', order);
  
      if (!order) {
        console.log('No Order Found for ID:', req.params.orderId);
        return res.status(404).json({ error: 'Order not found' });
      }
  
      const pdfBuffer = await generateInvoicePDF(order);
      console.log('PDF Buffer Generated');
  
      res.contentType('application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice_${order.orderId}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Full Invoice Download Error:', error);
      res.status(500).json({ 
        error: 'Invoice generation failed', 
        details: error.message 
      });
    }
  };

module.exports = {
  downloadInvoice,
};