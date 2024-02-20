const mongoose = require('mongoose');

const userModel = new mongoose.Schema({
   userName:{
      type:String,
      required:true
   },
   email:{
      type:String,
      required:true
   },
   password:{ 
      type:String,
      requird:true
   },
   phoneNum:{
      type:Number,
      required:true
   },
   isBlocked:{
      type:Boolean,
      default:false
   },
   image:{
      type : String
   }
})
 
module.exports = mongoose.model('User',userModel);
