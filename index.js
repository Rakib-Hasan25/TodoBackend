//!--------external module or library------------
const express = require("express");
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
const app = express();
const dotenv = require("dotenv");
dotenv.config({
  path: "./.env",
});
const cors = require("cors");

//!--------import from file---------
const connectDB = require("./db/index.js");
const ApiError = require("./utils/apiError.js");
const User = require("./models/user.model.js");
const Todo = require("./models/todo.model.js");

const ApiResponse= require("./utils/apiResponse.js");
const asyncHandler= require("./utils/asyncHandler.js");


//!--------middleware-----------
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser())
app.use(express.urlencoded({extended:true, limit:"16kb" }))



const verifyJWT=async(req, _, next) =>{
  try{
      const token= req.cookies?.accessToken
      
      
      if(!token){
          throw new ApiError(401, "Unauthorized request")
      }
      
      const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

      const user = await User.findById(decodedToken?._id)
      .select("-password -refreshToken")


      if(!user){
          //TODO: discuss with frontend
          throw new ApiError(401, "Invalid Access Token")
      }

      req.user = user;
    //we add a new object in the req ,
    next();
  }
  catch(error){
    throw new ApiError(401,error?.message|| "invalid access token")
  }
}

//!-------constants--------
const PORT = process.env.PORT || 3000;

//!------------All the routes----------

app.get("/", (req, res) => {
  res.send("hi");
});
//!1st type -------------------authentication-------------
const generateAccessandRefreshTokens = async(userId)=>{
  try{
    const user = await User.findById(userId)
   const accessToken= user.generateAccessToken()
   console.log("Generated access token", accessToken)
   const refreshToken= user.generateRefreshToken() 
   console.log("Generated REFRESH token",  refreshToken)



   user.refreshToken= refreshToken;
  
   await user.save({validateBeforeSave:false})
   //while saving refresh token we don't want any 
   //validatation like ("password , username exists or not")
   // so we just tell validationBeforeSave should be false

   return {accessToken:accessToken, refreshToken:refreshToken}

}
catch(error){
    throw new ApiError(500,
        "Something went wrong while generating access and refresh tokens")
}

}


app.post("/api/v1/users/sign-up", async (req, res) => {

  try{
    const { email, password } = req.body;

  if ([email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "all fields are required");
  }

  console.log("email", email);


  const existedUser = await User.findOne({
    $or: [{ email }, { password }],
  });


  console.log("user", existedUser);

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const user = await User.create({
    email,
    password,
  });
console.log("user", user);
   const createdUser=  await User.findById(user._id).select(
              "-password -refreshToken"
     )


     if(!createdUser){
      throw new ApiError(500,"something went wrong while registering the user")
    }
 

    return res.status(201).json(
     new ApiResponse(200, createdUser, "user registration successfully")
    )


  }
 catch (err) {
  res.status(err.code || 500).json({
                success: false,
                message:err.message 
            })
 }

}) ;






app.post("/api/v1/users/login", asyncHandler(async(req,res)=>{
  
  const {email,password} = req.body
  console.log("email ",email)

  if(!email){
      throw new ApiError(400, "email are required")
  }


//3rd step
 const user =  await User.findOne({
   $or:[{email}]  
  })


  if(!user){
      throw new ApiError(404, "user is not found")
  }

  // console.log("user : ",user)

  //4th step

  const isPasswordValid = await user.isPasswordCorrect(password)
  //"password" which the user just entered and "user" is the data
  // which we find from database when we searching from the User

  //user.isPasswordCorrect() this function is defined on user.model
  //for this reason we can use it

  if(!isPasswordValid){
      throw new ApiError(401, "Invaild user credentials")
  }


  const {accessToken,refreshToken}=await generateAccessandRefreshTokens(user._id);
  // for the user 
  // which we find from database, we just pass his id

  // console.log("accessToken : ", accessToken)



 const loggedInUser= await User.findById(user._id).select("-password -refreshToken")



  // console.log("loggedInuser : ", loggedInUser)
 const options={
  httpOnly:true,
  secure:true,
 }
 // by default our cookies can be modified by frontend 
 // but now only the backend/server can modify the cookies

 return res
 .status(200)
 .cookie("accessToken",accessToken,options)
 .cookie("refreshToken",refreshToken,options)
 .json(
  new ApiResponse(200,{
      user:loggedInUser,
      accessToken,
      refreshToken
  },
  "user logged in successfully"
  
  )
 )
 //here .cookie we can use beacause we use cookie-parser package
 //here, in json response we also send the access token and refresh token
 //frontend developer might need to save it in local storage , mostly needed
 // for appdeveloper

})
)

app.get("/api/v1/users/logout",verifyJWT,asyncHandler(async (req, res) => {
  // remove the refresh token from the database
  
      await User.findByIdAndUpdate(
          req.user._id,{
  
              $unset:{
                  refreshToken:1 //this removes the field from the document
              },
          },
          {
              new: true,
          }
          //new:true means "User.findbyIdUpdate()"  return a response
          //which gives us the  user data but now we will get the updated data,
          //means user refresh token will be undefined
      )
      // we get req.user._id because we define a middleware 
      // and this middleware insert a new object can 'user'
      //in the 'req'
  
  
      //remove cookies from the user which we give him
  
  
      const options={
          httpOnly:true,
          secure:true,
         }
  
  
         return res.status(200)
         .clearCookie("accessToken", options)
         .clearCookie("refreshToken",options).json(
          new ApiResponse(200,{}, "User logged out")
         )
  
  })
)




//------------------Todo(route)--------------
  
app.post('/api/v1/create-todo',verifyJWT,asyncHandler(async(req,res) => {

  const {title,description} = req.body

    if(
        [title,description].some(
            (field)=>field?.toLowerCase()==="")
            ){
                throw new ApiError("400","title and description are required")
    }

    const todo= await Todo.create({
      title,
      description,
      todoUploader:req.user._id
    })


    const createdTodo = await Todo.findById(todo._id)
    if(!createdTodo){
      throw new ApiError(500,"something went wrong while creating a new todo")
    }


    return res.status(201).json(
      new ApiResponse(200,createdTodo, "video upload  successfully")
     )
}))

app.get('/api/v1/getAllTodo',verifyJWT,asyncHandler(async(req,res) => {


 const todo =await Todo.find({ todoUploader: req.user._id });


// console.log("todo",todo)
if(!todo){
  throw new ApiError(500,"something went wrong while fetching todos")

}

return res.status(200).json(
  new ApiResponse(200, todo, "successfully fetched")
 )

}))


app.patch('/api/v1/update-todo/:todoId',verifyJWT,asyncHandler(async(req,res) => {


  const {todoId} = req.params
  const {title,description} = req.body

  if(!title || !description ){
    throw new ApiError(400, "All fields are required")
}

if(!todoId) throw new ApiError(400,"todo id is required")
  
  // const todo = await Todo.findById(todoId)

  const updatedTodo = await Todo.findByIdAndUpdate(
    todoId,{
        $set:{
            title:title,
            description:description,
        }
    },
    {
        new:true
    }
  )

   
  if(!updatedTodo) {
    throw new ApiError(500,"something went wrong when updating video details")
  }

  return res.status(200).json(
    new ApiResponse(200, updatedTodo, "video details updated successfully")
  )

}))



app.delete('/api/v1/delete-todo/:todoId',verifyJWT,asyncHandler(async(req,res) => {


  const {todoId} = req.params


if(!todoId?.trim()) throw new ApiError(400,"todo id is required")
  
  const todo = await Todo.findById(todoId)

  const rmTodo = await Todo.findByIdAndDelete(todoId)

  if (!rmTodo){
      throw new ApiError(500,"something is wrong while deleting the Todo")
  }
  return res.status(200).json(
      new ApiResponse(200, [],"todo deleted successfully")
    )

}))






























connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`server is running at ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });
