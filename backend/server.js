const express =require("express")
const connectDB = require("./config/db")
const cors = require('cors');
require('dotenv').config();
const session = require('express-session');
const cookieParser = require("cookie-parser");
const PORT =3000
const app = express()
connectDB()
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(
	cors({
		origin: process.env.CLIENT_URL,
		credentials: true,
	})
);
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
}))

const adminRoutes = require("./routes/adminRoutes")
const userRouter =require("./routes/userRoutes")
const authRouter= require("./routes/authRoutes")
app.use("/user",userRouter)
app.use("/admin",adminRoutes)
app.use("/auth",authRouter)
app.listen(PORT,()=>{
    console.log(`the server is running on the port ${PORT}`)
})

