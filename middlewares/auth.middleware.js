


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
        res.status(err.code || 500).json({
            success: false,
            message:err.message 
        })
    }
}


module.exports = verifyJWT