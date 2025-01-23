const mongoose = require('mongoose');
const Order = require('../model/orderSchema');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const moment = require('moment');

const generateSalesReport = async (req, res) => {
    try {
      const report = await Order.aggregate([
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

      // Separate aggregation for total sales summary
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
                $subtract: ['$originalAmount', '$currentAmount'] 
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
        bestSellingProducts: report
      });
    } catch (error) {
      console.error('Sales Report Error:', error);
      res.status(500).json({ 
        message: 'Error generating report', 
        errorDetails: error.message 
      });
    }
  };
  const exportToExcel = async (req, res) => {
    try {
      // Generate the sales report first
      const reportData = await Order.aggregate([
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
                $subtract: ['$originalAmount', '$currentAmount'] 
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
  
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Report');
  
      // Add summary data
      worksheet.columns = [
        { header: 'Total Orders', key: 'totalOrders' },
        { header: 'Total Sales Amount', key: 'totalSalesAmount' },
        { header: 'Original Amount', key: 'totalOriginalAmount' },
        { header: 'Total Discount', key: 'totalDiscountAmount' }
      ];
  
      // Add the first (and likely only) aggregation result
      if (reportData.length > 0) {
        worksheet.addRow(reportData[0]);
      }
  
      // Add payment method breakdown
      worksheet.addRow([]);
      worksheet.addRow(['Payment Method', 'Amount']);
      
      // Group and aggregate payment methods
      const paymentMethodSummary = reportData[0]?.paymentMethodBreakdown?.reduce((acc, item) => {
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
      // Generate sales summary directly
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
                $subtract: ['$originalAmount', '$currentAmount'] 
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
  
      const reportData = salesSummary[0] || {};
  
      // Group payment methods
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
  
      doc.fontSize(16)
        .text('Sales Report', { align: 'center', underline: true })
        .moveDown(0.5);
  
      doc.fontSize(12)
        .text(`Total Orders: ${reportData.totalOrders || 0}`)
        .text(`Total Sales Amount: $${(reportData.totalSalesAmount || 0).toFixed(2)}`)
        .text(`Original Amount: $${(reportData.totalOriginalAmount || 0).toFixed(2)}`)
        .text(`Total Discount: $${(reportData.totalDiscountAmount || 0).toFixed(2)}`)
        .moveDown();
  
      doc.fontSize(14)
        .text('Payment Method Breakdown:', { underline: true });
  
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
  exportToPDF
};