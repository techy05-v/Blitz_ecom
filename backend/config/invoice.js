const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const Order = require('../model/orderSchema');

const generateInvoicePDF = async (order) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  // Calculate correct subtotal using discounted prices
  const subtotal = (order.items || []).reduce((sum, item) => {
    return sum + ((item.discountedPrice || item.price || 0) * (item.quantity || 0));
  }, 0);

  const originalTotal = (order.items || []).reduce((sum, item) => {
    return sum + ((item.price || 0) * (item.quantity || 0));
  }, 0);

  const couponDiscount = order.couponApplied?.discountAmount || 0;
  const currentAmount = order.currentAmount || 0;

  // Rest of the header code remains the same
  doc.fontSize(20).text('TAX INVOICE', { align: 'right' }).moveDown();
  doc.fontSize(10)
      .text('Your Company Name', 50, 100)
      .text('Company Address', 50, 115)
      .text('GSTIN: XXXXXXXXXXXXX', 50, 130)
      .text('Invoice Date: ' + new Date().toLocaleDateString(), 400, 100)
      .text('Invoice No: ' + (order.orderId || 'N/A'), 400, 115);

  // Customer Details remain the same
  doc.text('Billing To:', 50, 180)
      .text(order.user?.name || 'Customer', 50, 195)
      .text(order.shippingAddress?.full_name || 'N/A', 50, 210)
      .text(order.shippingAddress?.street_address || 'N/A', 50, 225)
      .text(`${order.shippingAddress?.city || 'N/A'}, ${order.shippingAddress?.state || 'N/A'}`, 50, 240);

  // Invoice Table Header
  const invoiceTableTop = 280;
  doc.font('Helvetica-Bold')
      .text('Product', 50, invoiceTableTop)
      .text('Quantity', 250, invoiceTableTop)
      .text('Unit Price', 350, invoiceTableTop)
      .text('Total', 450, invoiceTableTop);

  doc.font('Helvetica');
  let position = invoiceTableTop + 20;

  // Item iteration with discounted prices
  (order.items || []).forEach(item => {
      const regularPrice = item.price || 0;
      const discountedPrice = item.discountedPrice || item.price || 0;
      const hasDiscount = regularPrice !== discountedPrice;
      const lineTotal = (item.quantity || 0) * discountedPrice;

      // Product name and quantity
      doc.text(item.product?.productName || 'Unknown Product', 50, position)
         .text((item.quantity || 0).toString(), 250, position);

      // Price display with discount if applicable
      if (hasDiscount) {
          doc.font('Helvetica')
             .text(`₹${discountedPrice.toFixed(2)}`, 350, position)
             .font('Helvetica')
             .fillColor('gray')
             .text(`(₹${regularPrice.toFixed(2)})`, 350, position + 10, { size: 8 })
             .fillColor('black');
      } else {
          doc.text(`₹${regularPrice.toFixed(2)}`, 350, position);
      }

      // Line total (using discounted price)
      doc.text(`₹${lineTotal.toFixed(2)}`, 450, position);
      
      position += hasDiscount ? 25 : 20;
  });

  // Totals Section
  position += 20;

  // Original total (before any discounts)
  doc.text('Original Total', 350, position)
      .text(`₹${originalTotal.toFixed(2)}`, 450, position);

  // Product Discounts
  const totalProductDiscount = originalTotal - subtotal;
  if (totalProductDiscount > 0) {
      position += 20;
      doc.text('Product Discount', 350, position)
          .text(`-₹${totalProductDiscount.toFixed(2)}`, 450, position);
  }

  // Subtotal (after product discounts, before coupon)
  position += 20;
  doc.text('Subtotal', 350, position)
      .text(`₹${subtotal.toFixed(2)}`, 450, position);

  // Coupon Discount
  if (couponDiscount > 0) {
      position += 20;
      doc.text('Coupon Discount', 350, position)
          .text(`-₹${couponDiscount.toFixed(2)}`, 450, position);
  }

  // Final Total
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

// Rest of the code remains the same
const downloadInvoice = async (req, res) => {
    try {
        console.log('Order ID Requested:', req.params.orderId);
  
        const order = await Order.findById(req.params.orderId)
            .populate('user', 'name email')
            .populate({
                path: 'items.product',
                select: 'productName regularPrice salePrice'
            })
            .populate('shippingAddress');
  
        if (!order) {
            console.log('No Order Found for ID:', req.params.orderId);
            return res.status(404).json({ error: 'Order not found' });
        }
  
        if (order.orderStatus !== 'Delivered') {
            return res.status(403).json({ 
                error: 'Invoice download not available',
                message: 'Invoice can only be downloaded for delivered orders'
            });
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