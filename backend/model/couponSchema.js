const mongoose= require("mongoose")
const { type } = require("os")

const  couponSchema = new mongoose.Schema({
    code:{
        type:String,
        required: true,
        unique:true,
        uppercase:true,
        trim:true
    },
    description:{
        type:String,
        required:true
    },
    createdOn:{
        type:Date,
        default:Date.now,
        required:true
    },
    expiresOn:{
        type:Date,
        required:true
    },
    offerPercentage:{
        type:Number,
        required:true,
        min:0,
        max:100
    },
    minimumPrice:{
        type:Number,
        required:true,
        min:0,

    },
    maximumDiscount:{
        type:Number,
        required:true,
        min:0
    },
    isList:{
        type:Boolean,
        default:true,

    },
    usageLimit:{
        type:Number,
        required:true,
        min:1
    },
    usedCount:{
        type:Number,
        default:0
    },
    userId:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }]
},{
    timestamps:true
})

//index foer faster coupons
couponSchema.index({code:1})
couponSchema.index({isList:1,expiresOn:1})
module.exports =mongoose.model("Coupon",couponSchema)