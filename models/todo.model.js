const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema({

    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true,
    },
    todoUploader:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    }
})

const Todo = mongoose.model('Todo', todoSchema)
module.exports = Todo; 