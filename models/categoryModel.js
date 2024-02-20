const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    }, 
    status:{
        type:Boolean,
        default:true
    },
    isListed:{
        type:Boolean,
        default:true
    },
    offer:{
        type : Number,
    }
})

module.exports = mongoose.model("Category",categorySchema);
