import React from 'react';
import { toast } from 'sonner';
import { axiosInstance } from '../../api/axiosConfig';

const InvoiceDownload = ({ orderId, orderStatus }) => {
    const isDelivered = orderStatus === "Delivered";
    
    const downloadInvoice = async () => {
        // First check if order is delivered
        if (!isDelivered) {
            toast.error('Invoice is only available after delivery', {
                className: 'bg-amber-50 text-amber-800 border-amber-200'
            });
            return;
        }

        const loadingToast = toast.loading('Preparing your invoice...', {
            className: 'bg-blue-50 text-blue-800 border-blue-200'
        });

        try {
            console.group('Invoice Download Process');
            console.log('Initiating invoice download for Order ID:', orderId);
            
            const response = await axiosInstance.get(`/user/orders/${orderId}/invoice`, {
                responseType: 'blob',
                onDownloadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    console.log(`Download Progress: ${percentCompleted}%`);
                }
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${orderId}.pdf`);
            
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.dismiss(loadingToast);
            toast.success('Your invoice has been downloaded successfully', {
                className: 'bg-green-50 text-green-800 border-green-200'
            });

        } catch (error) {
            toast.dismiss(loadingToast);
            
            if (error.response) {
                const status = error.response.status;
                const toastConfig = {
                    className: 'bg-amber-50 text-amber-800 border-amber-200'
                };

                switch (status) {
                    case 403:
                        toast.error('Order not delivered yet', {
                            ...toastConfig,
                            description: 'The invoice will be available after delivery.'
                        });
                        break;
                    case 404:
                        toast.error('Order not found', {
                            ...toastConfig,
                            description: 'Please refresh the page and try again.'
                        });
                        break;
                    case 401:
                        toast.error('Unable to download', {
                            ...toastConfig,
                            description: 'Please try refreshing the page.'
                        });
                        break;
                    default:
                        toast.error('Download failed', {
                            ...toastConfig,
                            description: 'Please try again later.'
                        });
                }
            } else {
                toast.error('Connection failed', {
                    className: 'bg-amber-50 text-amber-800 border-amber-200',
                    description: 'Please check your internet and try again.'
                });
            }

            console.error('Download Error:', error);
        }
    };

    return (
        <button 
            onClick={downloadInvoice}
            disabled={!isDelivered}
            className={`px-4 py-2 rounded transition-colors duration-200 ${
                isDelivered 
                    ? "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer" 
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
        >
            {isDelivered ? 'Download Invoice' : 'Invoice Available After Delivery'}
        </button>
    );
};

export default InvoiceDownload;