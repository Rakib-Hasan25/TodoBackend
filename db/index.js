const mongoose = require("mongoose");
const DB_NAME="todowebapp"


const connectDB = async ()=>{
    try{
        console.log(process.env.MONGODB_URI)
        const connectionInstance = await mongoose.connect
        (`${process.env.MONGODB_URI}/${DB_NAME}`);
        // after database connected we have some respone which we can hold/store
        console.log(`\n MongoDB connected !! DB HOST: 
        ${connectionInstance.connection.host}`)
        // connectionInstance.connection.host will tell us 
        // with whose database i am connected with , my i connected with right database

    }
    catch(error){
        console.log("MONGODB connection error :" , error);
        process.exit(1);
        //process.exit is a node js function which is used to exit our process 
    }
}

module.exports = connectDB;