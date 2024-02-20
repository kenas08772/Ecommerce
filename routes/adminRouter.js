const express = require('express')
const adminRouter = express.Router()
const session = require("express-session");
const database = require("../config/config")


const {
    upload
} = require("../multer/multer")
const adminController = require('../controllers/adminControllers')
const auth = require('../middleware/adminAuth')



//users List
adminRouter.get('/users', auth.isLogin, adminController.usersList)
adminRouter.get('/block', auth.isLogin, adminController.block)
adminRouter.get('/unblock', auth.isLogin, adminController.unBlock)

//category
adminRouter.get("/categories", auth.isLogin, adminController.categories)
adminRouter.post("/addCategory", adminController.addCategory)
adminRouter.get("/category/block", auth.isLogin, adminController.blockCategory)
adminRouter.get("/category/unBlock", auth.isLogin, adminController.unBlockCategory)
adminRouter.get("/editCategory", auth.isLogin, adminController.editCategory)
adminRouter.post("/updateingCategory", auth.isLogin, adminController.updatCategory)
adminRouter.get("/deleteCategory", auth.isLogin, adminController.deleteCategory)

//product

adminRouter.get("/productList", auth.isLogin, adminController.productList)
adminRouter.get("/createProduct", auth.isLogin, auth.isLogin, adminController.loadCreateingProduct)
adminRouter.post("/createProduct", upload.fields([{
    name: "coverimage",
    maxCount: 1
}, {
    name: "images"
}]), adminController.createProduct)
adminRouter.get("/blockProduct", auth.isLogin, adminController.blockProduct)
adminRouter.get("/unblockproduct", auth.isLogin, adminController.unblockproduct)
adminRouter.get("/editProduct", auth.isLogin, adminController.editProduct)
adminRouter.post("/updateProduct", upload.fields([{
    name: "coverimage",
    maxCount: 1
}]), adminController.updateProduct)
adminRouter.get("/deletProduct", auth.isLogin, adminController.deletProduct)


adminRouter.get('/orders', auth.isLogin, adminController.orders)
adminRouter.get('/order-detail/:orderId', auth.isLogin, adminController.orderdetails)
adminRouter.post('/order-status/:status', adminController.statuschange)


adminRouter.get('/', auth.isLogin, adminController.dashboard)
adminRouter.get('/generate-invoice', adminController.Salesreport)
adminRouter.get('/Weekly-genearate-report', adminController.WeeklySales)
adminRouter.get('/login', adminController.adminLoginGet)
adminRouter.post('/login', adminController.adminLoginPost)
adminRouter.get('/AdminLogout', adminController.AdminLougout)

adminRouter.get('/categoryOffer', adminController.categoryOffer)
adminRouter.post('/categoryOffer', adminController.categoryOfferCreate)
adminRouter.get('download-excel', adminController.excel)
adminRouter.post('/checkCategory', adminController.checkcategory)


//coupons
adminRouter.get('/coupon',adminController.couponGet)
adminRouter.post('/create-coupon',adminController.couponPost)
adminRouter.delete('/coupon-delete/:couponId',adminController.couponDelete)


module.exports = adminRouter