import { useState, useEffect } from "react"
import { axiosInstance } from "../../api/axiosConfig"
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

const SalesReportTable = () => {
  const [sales, setSales] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchSalesData()
  }, [])

  const fetchSalesData = async () => {
    try {
      setIsLoading(true);

      const response = await axiosInstance.get("/admin/salereport");

      console.log("API Response:", response.data); // Check the API response
      console.log("Sales Data:", response.data.reportData); // Check sales data specifically

      setSales(response.data.reportData || []); // Ensure you're setting the correct data
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };





  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const handleExportExcel = (sales) => {
    console.log("Sales Data before export:", sales);
    if (!sales.length) {
      console.log("No data available for export.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      sales.map((sale) => ({
        "Order ID": sale.orderId,
        Date: sale.date,
        Customer: sale.customerName,
        "Original Amount": sale.originalAmount,
        "Discount Applied": sale.discountAmount,
        "Final Amount": sale.currentAmount,
        "Payment Method": sale.paymentMethod,
        "Payment Status": sale.paymentStatus,
        "Order Status": sale.orderStatus,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");
    XLSX.writeFile(workbook, "Sales_Report.xlsx");

    console.log("Excel file exported successfully.");
  };

  const handleExportPDF = (sales) => {
    if (!sales.length) {
      console.log("No data available for export.");
      return;
    }

    const doc = new jsPDF();
    doc.text("Sales Report", 14, 10);

    const tableColumn = [
      "Order ID",
      "Date",
      "Customer",
      "Original Amount",
      "Discount",
      "Final Amount",
      "Payment Method",
      "Payment Status",
      "Order Status",
    ];

    const tableRows = sales.map((sale) => [
      sale.orderId,
      sale.date,
      sale.customerName,
      sale.originalAmount,
      sale.discountAmount,
      sale.totalAmount,
      sale.paymentMethod,
      sale.paymentStatus,
      sale.orderStatus,
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("Sales_Report.pdf");

    console.log("PDF file exported successfully.");
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading...</div>
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">Error: {error}</div>
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-800">Sales Report</h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleExportExcel(sales)} // Pass `sales` explicitly
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Excel
          </button>

          <button
            onClick={() => handleExportPDF(sales)} // Pass `sales` explicitly
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            PDF
          </button>
        </div>

      </div>
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left border">Order ID</th>
                <th className="p-3 text-left border">Date</th>
                <th className="p-3 text-left border">Customer</th>
                <th className="p-3 text-left border">Items</th>
                <th className="p-3 text-right border">Original Amount</th>
                <th className="p-3 text-right border">Discount</th>
                <th className="p-3 text-right border">Final Amount</th>
                <th className="p-3 text-left border">Payment Method</th>
                <th className="p-3 text-left border">Payment Status</th>
                <th className="p-3 text-left border">Order Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-3 border">{sale.orderId}</td>
                  <td className="p-3 border">{sale.date}</td>
                  <td className="p-3 border">{sale.customerName}</td>
                  <td className="p-3 border">
                    {sale.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span>{item.quantity} × {item.product}</span>                    </div>


                    ))}
                  </td>
                  <td className="p-3 text-right border">{formatCurrency(sale.originalAmount)}</td>
                  <td className="p-3 text-right border">{formatCurrency(sale.discountAmount)}</td>
                  <td className="p-3 text-right border">{formatCurrency(sale.totalAmount)}</td>
                  <td className="p-3 border capitalize">{sale.paymentMethod}</td>
                  <td className="p-3 border">
                    <span
                      className={`px-2 py-1 rounded text-sm ${sale.paymentStatus === "completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                        }`}
                    >
                      {sale.paymentStatus}
                    </span>
                  </td>
                  <td className="p-3 border">
                    <span
                      className={`px-2 py-1 rounded text-sm ${sale.orderStatus === "Delivered" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                        }`}
                    >
                      {sale.orderStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>  
          </table>
        </div>
      </div>
    </div>
  )
}

export default SalesReportTable

