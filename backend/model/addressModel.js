

const mongoose= require("mongoose")
const AddressSchema= new mongoose.Schema({

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true

    },
    address_type:{
        type:String,
        enum:["home","work","other"],
        default:"home"
    },
    full_name:{
        type:String,
        required:true

    },
    phone_number:{
        type:String,
        required:true
    },
    street_address:{
        type:String,
        required:true
    },
    apartment:{
        type:String,
    },
    city:{
        type:String,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    country:{
        type:String,
        required:true
    },
    postal_code:{
        type:String,
        required:true
    },
    is_default:{
        type:Boolean,
        default:false
    },
    landmark:{
        type:String,
    }
})
AddressSchema.index(
    { user: 1, is_default: 1 },
    { 
        unique: true,
        partialFilterExpression: { is_default: true }
    }
);
module.exports=mongoose.model("AddressSchema",AddressSchema)