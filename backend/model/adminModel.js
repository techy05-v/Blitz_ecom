const mongoose=  require("mongoose")

const adminSchema = new mongoose.Schema(
    {

        user_name:{
            type:String,
            required:true
        },
        email:{
            type:String,
            required:true
        },
        password:{
            type:String,
            required:function(){
              return  this.google_id?false:true
            }
        },
        google_id:{
            type:String,

        },
        last_login:{
            type:Date
        },
        created_at:{
            type:Date,
            default:Date.now,
        },
        updated_at:{
            type:Date,
            default:Date.now,
        }

    }
)
module.exports= mongoose.model("Admin",adminSchema)