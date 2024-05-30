const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


const userSchema = new mongoose.Schema({

    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim : true,  
    },
    password:{
        type: String,
        required:[true, "Password is required"]
    },

    refreshToken:{
        type:String
    }

},{timestamps:true})



// console.log(userSchema)

//! we used 'pre' middleware or hooks , which is used to do anything before saving the data in database


userSchema.pre("save", async function(next){
    if(!this.isModified("password"))return next();

    this.password = await bcrypt.hash(this.password, 10)// here 10 is round
    next();
    
})


//!we add our custom methods(isPasswordCorrect,generateAccessToken,generateRefreshToken) in userSchema.method 
//! to understand it we must have basic knowledge of "prototype" in javascript
userSchema.methods.isPasswordCorrect = async function (password){
    return  await bcrypt.compare(password, this.password) 
  }

  userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
         {
             //payload 
             _id : this._id,
             email : this.email,
             username:this.username,
             fullName:this.fullName,
             //'fullName' is payload key ,this.fullName come from database
         },
         process.env.ACCESS_TOKEN_SECRET,
         {
             expiresIn:process.env.ACCESS_TOKEN_EXPIRY
         }
 
     )
 
 }
 
 
 userSchema.methods.generateRefreshToken = function(){
     return jwt.sign(
         {
             //payload 
             _id : this._id,
             
         },
         process.env.REFRESH_TOKEN_SECRET,
         {
             expiresIn:process.env.REFRESH_TOKEN_EXPIRY
         }
 
     )
 }
 




 
 
 
 
 const User = mongoose.model('User',userSchema)

module.exports = User; 