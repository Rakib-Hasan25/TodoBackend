/*
 when we pass any function(promises) that handles asynchronous operations
 it can be either success or failure,
 => so , we know we have to wrap the function with try and catch block 
 **now we previously create this try and catch block for that we 
 don't have to use try and catch block multiple times 

*/


const asyncHandler  = (requestHandler) => 
    (req, res, next)=>{
       return Promise.resolve(requestHandler(req,res,next))
        .catch((err)=>next(err));
    }

    module.exports = asyncHandler


/*
    The asyncHandler function takes a requestHandler function as an argument.
It returns another function that takes req, res, and next as arguments.
Inside this returned function:
It calls the requestHandler function with req, res, and next as arguments.
It wraps the result of requestHandler in Promise.resolve() to ensure it's a Promise.
It catches any errors that might occur during the execution of requestHandler using .catch().
If an error occurs, it calls next(err) to pass the error to the next error-handling middleware.

error handling middleware using app.use((err, req, res, next) => { /* error handling logic



*/


    // const asyncHandler = (fn) => (req,res,next) => {
//     try{
//         return  fn(req,res,next)
//     }
//     catch(error){
//         res.status(err.code || 500).json({
//             success: false,
//             message:err.message 
//         })
//     }
// }

