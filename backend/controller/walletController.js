const Order = require("../model/orderSchema")
const Wallet = require("../model/walletSchema")

const useWalletBalance = async (req, res) => {
    try {
        const { amount, orderId ,userId} = req.body;
        console.log("userId",req.body)
        console.log("uuss",userId)
        if (!amount || amount <= 0) {
            return {
                success: false,
                message: 'Invalid amount'
            };
        }

        const wallet = await Wallet.findOne({ user: userId });
        console.log("ggghhhhhh",wallet)
        if (!wallet || wallet.balance < amount) {
            return {
                success: false,
                message: 'Insufficient wallet balance',
                availableBalance: wallet ? wallet.balance : 0
            };
        }

        // Add debit transaction with status
        wallet.transactions.push({
            amount: amount,
            type: 'debit',
            orderId: orderId,
            description: `Payment for order ${orderId}`,
            status: 'completed',
            date: new Date()
        });

        // Update balance
        wallet.balance -= amount;
        await wallet.save();

        return {
            success: true,
            message: 'Payment successful',
            data: {
                remainingBalance: wallet.balance,
                transactionDetails: wallet.transactions[wallet.transactions.length - 1]
            }
        };

    } catch (error) {
        console.error('Error in useWalletBalance:', error);
        return {
            success: false,
            message: 'Error processing wallet payment',
            error: error.message
        };
    }
};

const addRefundToWallet = async(userId, amount, orderId) => {
    try {
        const wallet = await Wallet.findOneAndUpdate(
            { user: userId },
            {
                $push: {
                    transactions: {
                        amount: amount,
                        type: "credit",
                        orderId: orderId,
                        description: `Refund credited for order ${orderId}`,
                        status: 'completed',
                        date: new Date()
                    }
                },
                $inc: { balance: amount }
            },
            { 
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        );

        return wallet;
    } catch(error) {
        console.log("error in addRefundWallet:", error);
        throw error;
    }
};

const getWalletDetails = async(req, res) => {
    try {
        const userId = req.user.data._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const wallet = await Wallet.findOne({ user: userId });
        console
        if (!wallet) {
            return res.status(200).json({
                success: true,
                data: {
                    balance: 0,
                    transactions: [],
                    totalMoneyIn: 0,
                    totalMoneyOut: 0,
                    pagination: {
                        currentPage: 1,
                        totalPages: 0,
                        totalTransactions: 0,
                        limit
                    }
                }
            });
        }

        // Sort transactions by date in descending order
        const sortedTransactions = wallet.transactions.sort((a, b) => b.date - a.date);
        
        // Calculate total money in/out from all transactions
        const totalMoneyIn = wallet.transactions
            .filter(tx => tx.type === 'credit')
            .reduce((sum, tx) => sum + tx.amount, 0);

        const totalMoneyOut = wallet.transactions
            .filter(tx => tx.type === 'debit')
            .reduce((sum, tx) => sum + tx.amount, 0);

        // Calculate pagination details
        const totalTransactions = sortedTransactions.length;
        const totalPages = Math.ceil(totalTransactions / limit);
        
        // Get paginated transactions
        const paginatedTransactions = sortedTransactions.slice(skip, skip + limit);

        return res.status(200).json({
            success: true,
            data: {
                balance: wallet.balance,
                transactions: paginatedTransactions,
                totalMoneyIn,
                totalMoneyOut,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalTransactions,
                    limit
                }
            }
        });
    } catch(error) {
        console.log("error in getWalletDetails", error);
        return res.status(500).json({
            success: false,
            message: "Error in Fetching Wallet details",
            error: error.message
        });
    }
};

module.exports = {
    getWalletDetails,
    useWalletBalance,
    addRefundToWallet
}