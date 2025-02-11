const mongoose =require("mongoose")
const { type } = require("os")
const unverifiedUserSchema = new mongoose.Schema({
    user_name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true
    },
    user_id:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true,
    },
    phone_number:{
        type:String,
        required:false
    },
    role:{
        type:String,
        required:true,
        enum:["user","admin"]
    },
    otp:{
        type:String,
        require:true
    },
    otpExpiry:{
        type:Date,
        required:true,

    },
    expiresAt: {
		type: Date,
		default: () => Date.now() + 24 * 60 * 60 * 1000,
		expires: 0, 
	},
})

module.exports= mongoose.model("UnverifiedUser",unverifiedUserSchema)