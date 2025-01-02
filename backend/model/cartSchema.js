
const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true 
    },
    items:[{
        product:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"ProductSchema",
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        size:{
            type:String,
            required:true
        },
        price:{
            type:Number,
            required:true
        },
        discountedPrice:{
            type:Number,
            required:true
        }
    }],
    totalAmount:{
        type:Number,
        required:true,
        default:0
    }
},{
    timestamps:true
})
cartSchema.index({user:1})
module.exports=mongoose.model("Cart",cartSchema)