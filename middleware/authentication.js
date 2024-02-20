const { log } = require("console");

const isLogin = async(req,res,next)=>{
    try {
       if(req.session.user_id){
         log(req.session.email);
          next()
       } 
       else{
          res.redirect('/login');
       }
    } catch (error) {
       console.log(error.message)
    }
 }
 
 const isLogout = async(req,res,next)=>{
    try {
      if(req.session.isBlocked) {
         req.session.user_id = null
         req.session.email = null
         next()
      }else if(req.session.user_id){
         res.redirect('/');
       }else{
          next();
       }

       
    } catch (error) {
       console.log(error.message)
    }
 }
 
 module.exports = {
    isLogin,
    isLogout
 }