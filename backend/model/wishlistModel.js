const mongoose= require("mongoose")


const wishlistSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    user_id:{
        type:String,
        required:true
    },
    products:[{
        product:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"ProductSchema",
            required:true
        },
        addedAt:{
            type:Date,
            default:Date.now
        }
    }],
    created_at:{
        type:Date,
        default:Date.now
    },
    updated_at:{
        type:Date,
        default:Date.now
    }
},
{
    collection:"wishlists"
})

wishlistSchema.index({user:1,user_id:1});
wishlistSchema.index({"products.product":1})
wishlistSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});
module.exports= mongoose.model("Wishlist",wishlistSchema)