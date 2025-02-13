import React, { useEffect, useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { axiosInstance } from '../../api/axiosConfig';

const WalletDashboard = () => {
  const [walletData, setWalletData] = useState({
    balance: 0,
    transactions: [],
    totalMoneyIn: 0,
    totalMoneyOut: 0
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalTransactions: 0,
    limit: 10
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWalletDetails = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/user/wallet/details?page=${page}&limit=${pagination.limit}`);
      console.log("bjvdvfghd",response.data)
      if (response.data.success) {
        setWalletData({
          balance: response.data.data.balance,
          transactions: response.data.data.transactions.map(tx => ({
            ...tx,
            _id: tx._id || `${tx.date}-${Math.random()}`
          })),
          totalMoneyIn: response.data.data.totalMoneyIn,
          totalMoneyOut: response.data.data.totalMoneyOut
        });
        setPagination(response.data.data.pagination);
      }
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching wallet details');
      console.error('Error fetching wallet details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchWalletDetails(newPage);
    }
  };

  useEffect(() => {
    fetchWalletDetails();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const PaginationControls = () => (
    <div className="flex items-center justify-between mt-4 border-t border-gray-200 pt-4">
      <div className="text-sm text-gray-600">
        Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
        {Math.min(pagination.currentPage * pagination.limit, pagination.totalTransactions)} of{' '}
        {pagination.totalTransactions} transactions
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1}
          className={`p-2 rounded-lg ${
            pagination.currentPage === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-1">
          {[...Array(pagination.totalPages)].map((_, index) => {
            const pageNum = index + 1;
            const isActive = pageNum === pagination.currentPage;
            
            // Only show a limited number of page buttons
            if (pagination.totalPages > 7) {
              if (
                pageNum === 1 ||
                pageNum === pagination.totalPages ||
                (pageNum >= pagination.currentPage - 1 && pageNum <= pagination.currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded-lg ${
                      isActive
                        ? 'bg-green-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              } else if (
                pageNum === pagination.currentPage - 2 ||
                pageNum === pagination.currentPage + 2
              ) {
                return <span key={pageNum}>...</span>;
              }
              return null;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-1 rounded-lg ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={pagination.currentPage === pagination.totalPages}
          className={`p-2 rounded-lg ${
            pagination.currentPage === pagination.totalPages
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-green-50 p-6 flex items-center justify-center">
        <div className="text-gray-600">Loading wallet details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-green-50 p-6 flex items-center justify-center">
        <div className="text-red-600">
          {error}
          <button 
            onClick={() => fetchWalletDetails(pagination.currentPage)}
            className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-green-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Main Wallet Card */}
        <div className="rounded-xl p-6 bg-white/80 backdrop-blur-sm border border-green-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Wallet className="w-8 h-8 text-green-600" />
              <h2 className="text-2xl font-semibold text-gray-800">My Wallet</h2>
            </div>
            <button 
              onClick={() => fetchWalletDetails(pagination.currentPage)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Refresh"
            >
              <History className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white mb-6">
            <p className="text-sm opacity-90 mb-2">Available Balance</p>
            <h3 className="text-3xl font-bold">₹ {walletData.balance.toLocaleString()}</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg p-4 bg-green-50 border border-green-100 shadow-sm">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <ArrowDownRight className="w-5 h-5" />
                <span className="font-medium">Money In</span>
              </div>
              <p className="text-lg font-semibold text-gray-800">₹ {walletData.totalMoneyIn.toLocaleString()}</p>
            </div>

            <div className="rounded-lg p-4 bg-yellow-50 border border-yellow-100 shadow-sm">
              <div className="flex items-center gap-2 text-yellow-600 mb-2">
                <ArrowUpRight className="w-5 h-5" />
                <span className="font-medium">Money Out</span>
              </div>
              <p className="text-lg font-semibold text-gray-800">₹ {walletData.totalMoneyOut.toLocaleString()}</p>
            </div>
          </div>

          {/* Recent Transactions */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
            </div>
            <div className="space-y-3">
              {walletData.transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No transactions yet
                </div>
              ) : (
                <>
                  {walletData.transactions.map((transaction) => (
                    <div 
                      key={transaction._id} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {transaction.description}
                          {transaction.orderId && (
                            <span className="text-xs text-gray-500 ml-2">
                              Order #{transaction.orderId}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                      <div className={`font-semibold ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'} ₹{transaction.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {pagination.totalPages > 1 && <PaginationControls />}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletDashboard;