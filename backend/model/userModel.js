const mongoose=require("mongoose")
const UserSchema = new mongoose.Schema(
    {
        user_name:{
            type:String,
        },
        email:{
            type:String,
            required:true
        },
        password:{
            type:String,
            required:function(){
                return this.google_id?false:true;
            }
        },
        user_id:{
            type:String,
            default:"blitz"+Date.now()+Math.floor(Math.random()*100000+Date.now() +900000)

        },
        google_id:{
            type:String,
        },
        avatar:{
            type:String,
        },
        isBlocked: {
            type: Boolean,
            default: false
          },
        resetToken:{
            type:String
        },
        resetTokenExpiry:{
            type:Date,
        },
        adress:[{
            type:mongoose.Schema.Types.ObjectId,
            ref:"AddressSchema"
        }],
        created_at:{
            type:Date,
            default:Date.now
        },
        updated_at:{
            type:Date,
            dafault:Date.now
        },
       
},
        {collection:"users"}
);

module.exports=mongoose.model("User",UserSchema)