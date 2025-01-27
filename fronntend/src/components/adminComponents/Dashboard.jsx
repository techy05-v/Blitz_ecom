import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import {axiosInstance} from '../../api/axiosConfig';

const StatCard = ({ icon, title, value, change, bgColor }) => (
  <div className={`${bgColor} rounded-xl shadow-lg text-white hover:scale-105 transition-transform duration-200`}>
    <div className="p-6">
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-white bg-opacity-25">
          {icon}
        </div>
        <div className="mx-5">
          <h4 className="text-2xl font-bold">{value || 'N/A'}</h4>
          <div className="text-white text-opacity-90">{title}</div>
        </div>
      </div>
      <div className="flex items-center mt-4">
        <div className={`text-sm ${change >= 0 ? 'bg-green-500' : 'bg-red-500'} px-2 py-1 rounded-full`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
        </div>
        <div className="text-white text-opacity-75 text-sm ml-2">from last week</div>
      </div>
    </div>
  </div>
);

const SalesChart = ({ salesData }) => {
  // Transform best selling products into chart-friendly format
  const chartData = salesData.bestSellingProducts?.map(product => ({
    name: product.productName,
    sales: product.totalSales,
    quantity: product.totalQuantity
  })) || [];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Sales Performance</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            formatter={(value, name, props) => {
              const { payload } = props;
              return name === 'sales' 
                ? [`$${value.toLocaleString()}`, 'Total Revenue'] 
                : [`${value}`, 'Quantity Sold'];
            }}
          />
          <Legend />
          <Bar dataKey="sales" fill="#8884d8" name="Sales Revenue" />
          <Bar dataKey="quantity" fill="#82ca9d" name="Units Sold" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

function Dashboard() {
  const [salesReport, setSalesReport] = useState({
    salesSummary: {
      totalOrders: 0,
      totalSalesAmount: 0,
      totalDiscountAmount: 0,
      totalOriginalAmount: 0,
      paymentMethodBreakdown: []
    },
    bestSellingProducts: [],
    timePeriod: 'month'
  });
  const [timePeriod, setTimePeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch sales report
  useEffect(() => {
    const fetchSalesReport = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get('/admin/report', {
          params: { timePeriod }
        });
        
        console.log('Full Response:', response);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
        
        if (response.data && response.data.salesSummary) {
          setSalesReport(response.data);
        } else {
          console.error('Unexpected response format');
          setError('Invalid data format received');
        }
      } catch (error) {
        console.error('Fetch Error:', {
          message: error.message,
          response: error.response,
          status: error.response?.status
        });
        setError(error.message || 'Failed to fetch sales report');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchSalesReport();
  }, [timePeriod]);

  // Export report to Excel
  const handleExportExcel = async () => {
    try {
      const response = await axiosInstance.get('/admin/export/excel', {
        responseType: 'blob',
        params: { timePeriod }
      });

      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `sales_report_${timePeriod}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
    } catch (error) {
      console.error('Error exporting Excel:', error);
    }
  };

  // Export report to PDF
  const handleExportPDF = async () => {
    try {
      const response = await axiosInstance.get('/admin/export/pdf', {
        responseType: 'blob',
        params: { timePeriod }
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `sales_report_${timePeriod}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <div className="space-x-4">
          {/* Time Period Selection */}
          <select 
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="mr-4 px-3 py-2 border rounded"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>

          <button 
            onClick={handleExportExcel}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            Export Excel
          </button>
          <button 
            onClick={handleExportPDF}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Export PDF
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          Error: {JSON.stringify(error)}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
          title="Total Orders" 
          value={salesReport.salesSummary.totalOrders}
          change={2.5}
          bgColor="bg-gradient-to-r from-purple-500 to-purple-600"
        />
        <StatCard 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          title="Total Revenue" 
          value={`${salesReport.salesSummary.totalSalesAmount.toFixed(2)}`}
          change={-1.5}
          bgColor="bg-gradient-to-r from-blue-500 to-blue-600"
        />
        <StatCard 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          title="Total Discount" 
          value={`${salesReport.salesSummary.totalDiscountAmount.toFixed(2)}`}
          change={5.2}
          bgColor="bg-gradient-to-r from-green-500 to-green-600"
        />
        <StatCard 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
          title="Original Amount" 
          value={`${salesReport.salesSummary.totalOriginalAmount.toFixed(2)}`}
          change={3.1}
          bgColor="bg-gradient-to-r from-pink-500 to-pink-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Existing components */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Best Selling Products</h2>
          {salesReport.bestSellingProducts?.map((product, index) => (
            <div key={index} className="flex justify-between mb-2 border-b pb-2">
              <div>
                <span className="font-medium">{product.productName}</span>
                <span className="text-sm text-gray-500 block">
                  Quantity: {product.totalQuantity}
                </span>
              </div>
              <span className="font-bold text-green-600">
              ₹{product.totalSales.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Payment Method Breakdown */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Payment Methods</h2>
          {salesReport.salesSummary.paymentMethodBreakdown?.map((payment, index) => (
            <div key={index} className="flex justify-between mb-2 border-b pb-2">
              <span className="font-medium capitalize">{payment.method}</span>
              <span className="font-bold text-blue-600">
              ₹{payment.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* New Sales Chart */}
        <SalesChart salesData={salesReport} />
      </div>
    </div>
  );
}

export default Dashboard;