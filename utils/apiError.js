class ApiError extends Error{
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""

    ){
        super(message) // we override node Error class "message"variable
        this.statusCode = statusCode// we override node Error class "status"variable (another way)
        this.data = null,
        this.message= message
        this.success = false 
        this.errors = errors

        if (stack){
            // to show proper error message
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this,this,constructor)
        }

    }
}


module.exports = ApiError;