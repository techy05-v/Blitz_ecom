import React from 'react';
import { toast } from 'sonner';
import { axiosInstance } from '../../api/axiosConfig';

const InvoiceDownload = ({ orderId, orderStatus }) => {
    const downloadInvoice = async () => {
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
                        toast('Invoice Not Available Yet', {
                            ...toastConfig,
                            description: 'The invoice will be available once your order is delivered.'
                        });
                        break;
                    case 404:
                        toast('Order Not Found', {
                            ...toastConfig,
                            description: 'Please refresh the page and try again.'
                        });
                        break;
                    case 401:
                        toast('Download Issue', {
                            ...toastConfig,
                            description: 'Unable to download invoice. Please try again.'
                        });
                        break;
                    case 500:
                        toast('Temporary Issue', {
                            ...toastConfig,
                            description: 'We\'re experiencing technical difficulties. Please try again in a few minutes.'
                        });
                        break;
                    default:
                        toast('Download Unavailable', {
                            ...toastConfig,
                            description: 'Please try again later or contact support if the issue persists.'
                        });
                }
            } else if (error.request) {
                toast('Connection Issue', {
                    className: 'bg-amber-50 text-amber-800 border-amber-200',
                    description: 'Please check your internet connection and try again.'
                });
            } else {
                toast('Download Issue', {
                    className: 'bg-amber-50 text-amber-800 border-amber-200',
                    description: 'Unable to prepare your invoice. Please try again.'
                });
            }

            console.error('Download Error:', error);
        }
    };

    // Only render the button if order status is "Delivered"
    if (orderStatus !== "Delivered") {
        return null;
    }

    return (
        <button 
            onClick={downloadInvoice}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors duration-200"
        >
            Download Invoice
        </button>
    );
};

export default InvoiceDownload;