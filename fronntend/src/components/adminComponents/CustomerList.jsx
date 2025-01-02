import React, { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { axiosInstance } from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../confirmationModal/ConfirmationMadal';

const CustomAlert = ({ variant = 'default', title, description }) => {
  const bgColor = variant === 'destructive' ? 'bg-red-50' : 'bg-blue-50';
  const textColor = variant === 'destructive' ? 'text-red-800' : 'text-blue-800';
  const borderColor = variant === 'destructive' ? 'border-red-200' : 'border-blue-200';

  return (
    <div className={`rounded-md ${bgColor} p-4 mb-4 border ${borderColor}`}>
      {title && (
        <h3 className={`text-sm font-medium ${textColor} mb-2`}>{title}</h3>
      )}
      {description && (
        <div className={`text-sm ${textColor}`}>{description}</div>
      )}
    </div>
  );
};

const CustomerList = () => {
  const [userDatas, setUserDatas] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // State for confirmation modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState({ type: '', id: null, isBlocked: false });

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/admin/users');
      setUserDatas(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching user data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (userId, isBlocked) => {
    try {
      await axiosInstance.patch(`/admin/users/${userId}/toggle-block`, {
        isBlocked: !isBlocked
      });
      
      setUserDatas(prevUsers => 
        prevUsers.map(user => 
          user._id === userId ? { ...user, isBlocked: !isBlocked } : user
        )
      );
      
      toast.success(`User ${!isBlocked ? 'blocked' : 'unblocked'} successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleViewCustomer = (customerId) => {
    navigate(`/customers/${customerId}`);
  };

  const openModal = (actionType, userId, isBlocked) => {
    setModalAction({ type: actionType, id: userId, isBlocked });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalAction({ type: '', id: null, isBlocked: false });
  };

  const handleConfirm = async () => {
    if (modalAction.type === 'toggleStatus' && modalAction.id) {
      await handleStatusChange(modalAction.id, modalAction.isBlocked);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Toaster position="top-right" richColors/>
      <h1 className="text-3xl font-semibold">Customers</h1>
      
      {error && (
        <CustomAlert
          variant="destructive"
          title="Error Loading Customers"
          description={error}
        />
      )}

      {!error && (!userDatas || userDatas.length === 0) ? (
        <CustomAlert
          title="No Customers"
          description="No customer data available"
        />
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {userDatas && userDatas.map((customer) => (
                <tr key={customer._id}>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10">
                        <img
                          className="w-full h-full rounded-full"
                          src={`https://static.vecteezy.com/system/resources/previews/024/183/502/non_2x/male-avatar-portrait-of-a-young-man-with-a-beard-illustration-of-male-character-in-modern-color-style-vector.jpg`}
                          alt={`${customer.user_name}'s avatar`}
                        />
                      </div>
                      <div className="ml-3">
                        <p className="text-gray-900 whitespace-no-wrap">
                          {customer.user_name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{customer.email}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      customer.isBlocked
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {customer.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <button 
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                      onClick={() => handleViewCustomer(customer._id)}
                    >
                      View
                    </button>
                    <button 
                      className={`${
                        customer.isBlocked
                          ? 'text-green-600 hover:text-green-900'
                          : 'text-red-600 hover:text-red-900'
                      }`}
                      onClick={() => openModal('toggleStatus', customer._id, customer.isBlocked)}
                    >
                      {customer.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmationModal
        isOpen={modalOpen}
        onClose={closeModal}
        onConfirm={handleConfirm}
        title={`Confirm ${modalAction.isBlocked ? 'Unblock' : 'Block'}`}
        message={`Are you sure you want to ${modalAction.isBlocked ? 'unblock' : 'block'} this user?`}
      />
    </div>
  );
};

export default CustomerList;

