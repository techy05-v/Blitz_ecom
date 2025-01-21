

const { log } = require("console")
const Order = require("../model/orderSchema")
const Wallet =require("../model/walletSchema")

const addRefundToWallet = async(userId, amount, orderId) => {
    try {
        // Use findOneAndUpdate with upsert option
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
                new: true,      // Return the updated document
                upsert: true,   // Create if it doesn't exist
                setDefaultsOnInsert: true // Apply schema defaults if new doc is created
            }
        );

        return wallet;
    } catch(error) {
        console.log("error in addRefundWallet:", error);
        throw error;
    }
};

// get wallet balnce and transactions

const getWalletDetails = async(req,res)=>{

    try{
    const userId = req.user.data.id 
    const wallet = await  Wallet.findOne({user:userId});
    if(!wallet){
        return res.status(200).json({
            success:true,
            data:{
                balance:0,
                transactions:[]
            }
        })
    }

    // sort transactions  by data in descending order

    const SortedTransactions = wallet. transactions.sort((a,b)=>b.date-a.date)
    return res.status(200).json({
        success:true,
        data:{
            balance:wallet.balance,
            transactions:SortedTransactions
        }
    })
}
catch(error){
    console.log("error in getWalletDetails",error);
    return res.status(500).json({
        success:false,
        message:"Error in Fetching Wallet details",
        error:error.message
    })
    
}
}

const useWalletBalance = async (req, res) => {
    try {
        const { amount, orderId } = req.body;
        const userId = req.user.data.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        const wallet = await Wallet.findOne({ user: userId });
        if (!wallet || wallet.balance < amount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient wallet balance',
                availableBalance: wallet ? wallet.balance : 0
            });
        }

        // Add debit transaction
        wallet.transactions.push({
            amount: amount,
            type: 'debit',
            orderId: orderId,
            description: `Payment for order ${orderId}`
        });

        // Update balance
        wallet.balance -= amount;
        await wallet.save();

        return res.status(200).json({
            success: true,
            message: 'Payment successful',
            data: {
                remainingBalance: wallet.balance,
                transactionDetails: wallet.transactions[wallet.transactions.length - 1]
            }
        });

    } catch (error) {
        console.error('Error in useWalletBalance:', error);
        return res.status(500).json({
            success: false,
            message: 'Error processing wallet payment',
            error: error.message
        });
    }
};


module.exports ={
    getWalletDetails,
    useWalletBalance,
    addRefundToWallet
}