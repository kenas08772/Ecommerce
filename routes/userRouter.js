const express = require('express')
const router = express.Router()
const user =require('../controllers/userControllers')
const session=require("express-session");
const nocache=require("nocache");
const {upload} = require('../multer/multer')


const auth = require('../middleware/authentication')
const userController=require('../controllers/userControllers')
const config = require('../config/config') 

router.use(nocache());
router.use(session({
    secret:config.sessionSecretId,
    resave:false,
    saveUninitialized:true
}))




//    main page routers
router.get('/',userController.home)
router.get('/home',userController.homePage)



//  Login page router
router.get('/login',auth.isLogout,userController.loginGet)
router.post('/login',auth.isLogout,userController.loginPost)

router.get('/otp',userController.loadOtp)
router.post("/otpVerification",userController.verifyOtp)


//create user routouters

router.get('/signup',auth.isLogout,userController.signupGet)
router.post('/signup',userController.signupPost)


//otp
router.get('/otp',userController.loadOtp)
router.post('/verifyotp',userController.verifyOtp)


//Logout 
router.get('/logout',userController.userLogout)


router.get('/forgotpassword',userController.forgotGet)

router.post('/forgotPasswordPost',userController.forgotpasswordPost)
router.get('/resetPassword',userController.resetPassword)
router.post('/resetPasswordPost',userController.resetPost)

router.get('/shop',userController.userShop)
 

router.get('/details/:productId',userController.ProductDetailedView)




//userprofile
router.get('/userProfile',auth.isLogin ,userController.userProfileGet)

router.get('/profile/change-password',userController.changePassword)

router.post('/profile/addAddress',userController.userAddAddress)

router.post('/profile/editAddress',userController.userEditAddress)

router.delete('/profile/deleteAddress',userController.userdeleteAddress)

router.post('/profile/editProfile',userController.userDetailEdit)

router.get('/orders',userController.order)
router.post('/cancel-order/:id',userController.ordercancel)
router.post('/edit-profile',upload.single('profileImage'),userController.editProfile)

router.post('/change-password',userController.changePassword)
router.post('/remove-address/:type',userController.removeAddress)
router.get('/invoice/:orderId',userController.Invoice)


module.exports=router 