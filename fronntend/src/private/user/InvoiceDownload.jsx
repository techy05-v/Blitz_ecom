import React from 'react';
import {axiosInstance} from '../../api/axiosConfig';

const InvoiceDownload = ({ orderId }) => {
    const downloadInvoice = async () => {
        try {
            console.group('Invoice Download Process');
            console.log('Initiating invoice download for Order ID:', orderId);
            
            console.log('Axios Configuration:', {
                baseURL: axiosInstance.defaults.baseURL,
                headers: axiosInstance.defaults.headers
            });

            console.time('Invoice Download Duration');
            const response = await axiosInstance.get(`/user/orders/${orderId}/invoice`, {
                responseType: 'blob',
                // Add additional config for debugging
                onDownloadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    console.log(`Download Progress: ${percentCompleted}%`);
                }
            });

            console.timeEnd('Invoice Download Duration');
            console.log('Response Details:', {
                status: response.status,
                headers: response.headers,
                data: response.data
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${orderId}.pdf`);
            
            console.log('Generated Download Link:', link.href);
            
            document.body.appendChild(link);
            link.click();
            link.remove();

            console.log('Invoice downloaded successfully');
            console.groupEnd();

        } catch (error) {
            console.groupEnd();
            console.error('Comprehensive Invoice Download Error:', {
                message: error.message,
                name: error.name,
                fullError: error,
                responseStatus: error.response?.status,
                responseData: error.response?.data,
                requestConfig: error.config
            });
            
            // Detailed error handling
            if (error.response) {
                // Server responded with an error status
                alert(`Server Error: ${error.response.status} - ${error.response.data.error || 'Unknown error'}`);
                console.log('Server Response Error Details:', error.response);
            } else if (error.request) {
                // Request made but no response received
                alert('No response from server. Check network connection.');
                console.log('Request Details:', error.request);
            } else {
                // Something else went wrong
                alert('Error setting up invoice download.');
                console.log('Error Setup Details:', error.message);
            }
        }
    };

    return (
        <button 
            onClick={downloadInvoice} 
            className="bg-blue-500 text-white px-4 py-2 rounded"
        >
            Download Invoice
        </button>
    );
};

export default InvoiceDownload;