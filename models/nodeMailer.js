const nodemailer = require("nodemailer");
const randomstring = require('randomstring');
require("dotenv").config();
const randomString =require("randomstring");
const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user: process.env.EMAIL,
        pass:process.env.PASSWORD
    }
});

function sendOtp(email){
    console.log(email);
   
    const otp = randomString.generate({
        length:6,
        charset:"numeric"
    })
    const mailOption ={
        from:"E-CART",
        to:email,
        subject:"your varification code ",
        text:`Your OTP is : ${otp}`
    }
    console.log(otp);
    transporter.sendMail(mailOption,function(err,info){
        if(err){
            console.log(err);
        }else{
            console.log(`Email sent:`+info.response);
        }
    });
    return otp
}

module.exports={sendOtp}