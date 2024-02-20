const express = require('express');
const cartRouter = express.Router();
const nocache=require('nocache')

cartRouter.use(nocache());


const cartControllers = require('../controllers/cartControllers');
    
const {isLogin} = require('../middleware/authentication')



cartRouter.get('/',isLogin,cartControllers.cartGet);

cartRouter.post('/addtoCart',cartControllers.cartAdd);

// function nocache(req, res, next) {
//     res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
//     next();
//   }

cartRouter.put('/update-cart-quantity/:productId',cartControllers.cartPut)

cartRouter.delete('/remove-product/:productId',cartControllers.cartRemove)

cartRouter.patch('/update-cart-total',cartControllers.cartbillTotalUpdate)

cartRouter.get('/check-verify',cartControllers.checkverify)

cartRouter.get('/checkout',cartControllers.checkoutGet)

cartRouter.post('/checkout',cartControllers.checkoutPost)
cartRouter.post('/verify-payment',cartControllers.razorpayVerify);

cartRouter.get('/order-confirmation/:orderId',cartControllers.orderConfirmation);

cartRouter.post('/editAddress',cartControllers.userEditAddress)
cartRouter.get('/whishlistGet',cartControllers.whislistGet)
cartRouter.post('/addtoWhishlist',cartControllers.addToWHislist)
cartRouter.delete('/remove-whislist:product',cartControllers.whislistRemove)
cartRouter.post('/add-toWhislistCart',cartControllers.whishlistAddtoCart)

cartRouter.post('/coupon-apply',cartControllers.CouponApply);

module.exports={cartRouter};