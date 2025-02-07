const mongoose = require('mongoose');
const Order = require('../model/orderSchema');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const moment = require('moment');

const generateSalesReport = async (req, res) => {
    try {
      // Best selling products aggregation
      const bestProducts = await Order.aggregate([
        {
          $match: {
            paymentStatus: 'completed'
          }
        },
        {
          $unwind: '$items'
        },
        {
          $lookup: {
            from: 'productschemas',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productDetails'
          }
        },
        {
          $unwind: '$productDetails'
        },
        {
          $group: {
            _id: '$productDetails._id',
            productName: { $first: '$productDetails.productName' },
            category: { $first: '$productDetails.category' },
            totalQuantity: { $sum: '$items.quantity' },
            totalSales: { $sum: '$currentAmount' }
          }
        },
        {
          $sort: { totalSales: -1 }
        },
        {
          $limit: 5
        }
      ]);

      // Best selling categories aggregation
      const bestCategories = await Order.aggregate([
        {
          $match: {
            paymentStatus: 'completed'
          }
        },
        {
          $unwind: '$items'
        },
        {
          $lookup: {
            from: 'productschemas',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productDetails'
          }
        },
        {
          $unwind: '$productDetails'
        },
        {
          $lookup: {
            from: 'categoryschemas',
            localField: 'productDetails.category',
            foreignField: '_id',
            as: 'categoryDetails'
          }
        },
        {
          $unwind: '$categoryDetails'
        },
        {
          $group: {
            _id: '$categoryDetails._id',
            categoryName: { $first: '$categoryDetails.CategoryName' },
            totalQuantity: { $sum: '$items.quantity' },
            totalSales: { $sum: '$currentAmount' },
            numberOfProducts: { $addToSet: '$productDetails._id' }
          }
        },
        {
          $project: {
            categoryName: 1,
            totalQuantity: 1,
            totalSales: 1,
            uniqueProducts: { $size: '$numberOfProducts' }
          }
        },
        {
          $sort: { totalSales: -1 }
        },
        {
          $limit: 5
        }
      ]);

      // Sales summary aggregation
      const salesSummary = await Order.aggregate([
        {
          $match: {
            paymentStatus: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSalesAmount: { $sum: '$currentAmount' },
            totalOriginalAmount: { $sum: '$originalAmount' },
            totalDiscountAmount: { 
              $sum: { 
                $abs: { $subtract: ['$originalAmount', '$currentAmount'] } 
              } 
            },
            paymentMethodBreakdown: {
              $push: { 
                method: '$paymentMethod', 
                amount: '$currentAmount' 
              }
            }
          }
        }
      ]);

      res.json({
        salesSummary: salesSummary[0] || {},
        bestSellingProducts: bestProducts,
        bestSellingCategories: bestCategories
      });
    } catch (error) {
      console.error('Sales Report Error:', error);
      res.status(500).json({ 
        message: 'Error generating report', 
        errorDetails: error.message 
      });
    }
};

const getsalereportByAdmin = async (req, res) => {
  console.log("🔹 Sales Report API Called"); // Debugging line

  try {
    const orders = await Order.find()
      .populate({
        path: "user",
        select: "user_name email"
      })
      .populate({
        path: "items.product",
        select: "productName regularPrice salePrice category images",
        populate: {
          path: "category",
          select: "name"
        }
      })
      .populate({
        path: "couponApplied.couponId",
        select: "code discountAmount"
      })
      .sort({ createdAt: -1 });

    console.log("Orders Fetched:", orders.length); // Log the number of orders

    if (!orders.length) {
      return res.status(404).json({ success: false, message: "No sales data found" });
    }

    const reportData = orders.map((order) => ({
      orderId: order.orderId,
      date: order.createdAt.toISOString().split("T")[0],
      customerName: order.user?.user_name || "Unknown",
      items: order.items.map((item) => ({
        product: item.product?.productName || "Unknown",
        category: item.product?.category?.name || "Unknown",
        quantity: item.quantity,
        price: item.price,
        salePrice: item.product?.salePrice,
        image: item.product?.images[0] || ""
      })),
      originalAmount: order.originalAmount,
      discountAmount: order.couponApplied?.discountAmount || 0,
      totalAmount:order.finalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
    }));

    console.log("Report Data:", reportData); // Debugging log

    res.status(200).json({ success: true, reportData });
  } catch (error) {
    console.error("❌ Error fetching sales report:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const exportToExcel = async (req, res) => {
    try {
      // Get all report data
      const salesSummary = await Order.aggregate([/* ... existing aggregation ... */]);
      const bestCategories = await Order.aggregate([/* ... category aggregation from above ... */]);
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Report');

      // Add summary data (existing code...)
      worksheet.columns = [
        { header: 'Total Orders', key: 'totalOrders' },
        { header: 'Total Sales Amount', key: 'totalSalesAmount' },
        { header: 'Original Amount', key: 'totalOriginalAmount' },
        { header: 'Total Discount', key: 'totalDiscountAmount' }
      ];

      if (salesSummary.length > 0) {
        worksheet.addRow(salesSummary[0]);
      }

      // Add best selling categories section
      worksheet.addRow([]);
      worksheet.addRow(['Best Selling Categories']);
      worksheet.addRow(['Category Name', 'Total Sales', 'Total Quantity', 'Unique Products']);
      
      bestCategories.forEach(category => {
        worksheet.addRow([
          category.categoryName,
          category.totalSales,
          category.totalQuantity,
          category.uniqueProducts
        ]);
      });

      // Add payment method breakdown (existing code...)
      worksheet.addRow([]);
      worksheet.addRow(['Payment Method', 'Amount']);
      
      const paymentMethodSummary = salesSummary[0]?.paymentMethodBreakdown?.reduce((acc, item) => {
        acc[item.method] = (acc[item.method] || 0) + item.amount;
        return acc;
      }, {});

      if (paymentMethodSummary) {
        Object.entries(paymentMethodSummary).forEach(([method, amount]) => {
          worksheet.addRow([method, amount]);
        });
      }

      res.setHeader(
        'Content-Type', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition', 
        `attachment; filename=sales_report_${moment().format('YYYY-MM-DD')}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Export to Excel Error:', error);
      res.status(500).json({ 
        message: 'Error exporting report', 
        errorDetails: error.message 
      });
    }
};

const exportToPDF = async (req, res) => {
    try {
      // Get all report data
      const salesSummary = await Order.aggregate([/* ... existing aggregation ... */]);
      const bestCategories = await Order.aggregate([/* ... category aggregation from above ... */]);

      const reportData = salesSummary[0] || {};
      
      const paymentMethodSummary = reportData.paymentMethodBreakdown?.reduce((acc, item) => {
        acc[item.method] = (acc[item.method] || 0) + item.amount;
        return acc;
      }, {});

      const doc = new PDFDocument();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition', 
        `attachment; filename=sales_report_${moment().format('YYYY-MM-DD')}.pdf`
      );

      doc.pipe(res);

      // Sales Summary Section
      doc.fontSize(16)
        .text('Sales Report', { align: 'center', underline: true })
        .moveDown(0.5);

      doc.fontSize(12)
        .text(`Total Orders: ${reportData.totalOrders || 0}`)
        .text(`Total Sales Amount: $${(reportData.totalSalesAmount || 0).toFixed(2)}`)
        .text(`Original Amount: $${(reportData.totalOriginalAmount || 0).toFixed(2)}`)
        .text(`Total Discount: $${(reportData.totalDiscountAmount || 0).toFixed(2)}`)
        .moveDown();

      // Best Selling Categories Section
      doc.fontSize(14)
        .text('Best Selling Categories:', { underline: true })
        .moveDown(0.5);

      doc.fontSize(12);
      bestCategories.forEach(category => {
        doc.text(`Category: ${category.categoryName}`)
          .text(`Total Sales: $${category.totalSales.toFixed(2)}`)
          .text(`Total Quantity: ${category.totalQuantity}`)
          .text(`Unique Products: ${category.uniqueProducts}`)
          .moveDown(0.5);
      });

      // Payment Methods Section
      doc.fontSize(14)
        .text('Payment Method Breakdown:', { underline: true })
        .moveDown(0.5);

      doc.fontSize(12);
      if (paymentMethodSummary) {
        Object.entries(paymentMethodSummary).forEach(([method, amount]) => {
          doc.text(`${method}: $${amount.toFixed(2)}`);
        });
      }

      doc.end();
    } catch (error) {
      console.error('Export to PDF Error:', error);
      res.status(500).json({ 
        message: 'Error exporting PDF', 
        errorDetails: error.message 
      });
    }
};

module.exports = {
  generateSalesReport,
  exportToExcel,
  exportToPDF,
  getsalereportByAdmin
};