const mongoose = require('mongoose')
const User = require('../models/userModels')
const Product = require('../models/productModels');
const {whislistModel} = require('../models/whislist');
const Category = require('../models/categoryModel');
const Cart = require('../models/cartModels');
const AddressModel=require('../models/adressmodels');
const Order = require('../models/oderdetails');
const Razorpay = require('razorpay')
const dotenv = require("dotenv").config()
const crypto = require("crypto");
const {Coupon} =require('../models/couponModels')
let cartAdd = async (req, res) => {
    try {
        const productId = req.body.productId;

        
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product Not Found'
            });
        }

        const userId = req.session.user_id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        let cart = await Cart.findOne({
            owner: userId
        });

        if (!cart) {
           
            cart = new Cart({
                owner: userId,
                items: [],
                billTotal: 0
            });
        }

        const cartItem = cart.items.find((item) => item.productId.toString() === productId);

        if (cartItem) {
        
            cartItem.quantity += 1;
            cartItem.price = cartItem.quantity * product.price;
        } else {
          
            cart.items.push({
                productId: productId,
                name: product.name,
                image: product.coverimage,
                productPrice: product.price,
                quantity: 1,
                price: product.price
            });
        }

        cart.billTotal = cart.items.reduce((total, item) => total + item.price, 0);

    
        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Item added to cart'
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}


let  cartGet = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const category = await Category.find();
        const cart = await Cart.findOne({
            owner: userId
        });
        console.log(cart);
        if(cart && cart.items.length>0){
        for (const item of cart.items) {
            console.log(item.productId);
            let data = await Product.findOne({ _id: item.productId })
            console.log(data);
            item.data = data
        }
    }
       
        const cartItemCount = cart ? cart?.items.length : 0;
        let user = (userId) ? true : false
        return res.render('cart', {
            category,
            cart: cart,
            user,
            cartItemCount: cartItemCount
        })

    } catch (err) {
        console.log(err)
        return res.status(500).json({
            message: err
        })
    }
}


let cartPut = async (req, res) => {
    try {
        const producdId = req.params.productId;
        const newQuantity = req.body.quantity;
        const productTotal = req.body.productTotal;
        console.log(productTotal);

        const userId = req.session.user_id;
        const cart = await Cart.findOne({ owner: userId })

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const cartItem = cart.items.find((item) => item.productId.toString() === producdId);


        if (!cartItem) {
            return res.status(404).json({ success: false, message: 'Cart item not found' });
        }
        const product = await Product.findById(producdId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (newQuantity > product.countInStock) {
            return res.status(201).json({ success: false, message: 'Quantity exceeds Currently Out of  stock' });
        } else {

            cartItem.quantity = newQuantity;
            cartItem.price = newQuantity * cartItem.productPrice;

            let total = 0;
            cart.items.forEach((item) => {
                if (item.selected) {
                    total += product.price * item.quantity;
                }
            });

            cart.billTotal = total;
            

            await cart.save(); 

            return res.status(200).json({ success: true, message: 'Quantity updated successfully' });
        }


    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}




let cartRemove = async (req, res) => {
    try {
        const productId = req.params.productId;
        const userId = req.session.user_id;
        console.log(userId);
        let cart = await Cart.findOne({ owner: userId });

     
        if (!cart) {
            cart = new Cart({ owner: userId, items: [] });
        }

        const productIndex = cart.items.findIndex((item) => item.productId.toString() === productId);
          console.log(productIndex);
        if (productIndex === -1) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
 
        if (cart.items[productIndex].selected) {
            cart.billTotal -= cart.items[productIndex].price;
        }

        cart.items.splice(productIndex, 1);

        await cart.save();
        return res.status(200).json({ success: true, message: 'Product removed from the cart' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

async function updateTotal(req) {
        const userId = req.session.user_id;
        const cart = await Cart.findOne({owner:userId});

        if (!cart) {
            return null
        }

      
        let total = 0;
        cart.items.forEach(async (item) => {
            const product = await Product.findById(item.productId)
            item.price = product.price
            total += item.productPrice * item.quantity;
        });
        
        cart.billTotal = total;
        await cart.save();
        return cart
}


let cartbillTotalUpdate = async (req, res,next) => {
    try {
        const data = await updateTotal(req)
        if(data == null) {
            res.status(404).json({ success: false, message: 'Cart is not found based on user' }) 
        } else {
            res.status(200).json({ success: true, message: 'Successfully billtotal updated', billTotal: data.billTotal });
        }

        

    } catch (err) {
        console.log(err);
        next(err)
    }
}








const checkverify = (req, res, next) => {
    req.session.checkout = true
    return res.redirect('/cart/checkout')
}

let checkoutGet = async (req, res,next) => {
    try {

      let Adreessmessage;

     const coupon =await Coupon.find()
        if (req.session.checkout === true) {
            let user = req.session.user_id ? true : false;
            
            const addresses = await AddressModel.findOne({ user: req.session.user_id })
            const userDetails = await User.findOne({ _id: req.session.user_id })
            const [userDetail] = await User.aggregate([
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(req.session.user_id),

                    }
                }, {
                    $lookup: {
                        from: 'wallets',
                        localField: "wallet",
                        foreignField: "_id",
                        as: "WalletData"
                    }
                },
                {
                    $limit: 1,
                },

            ])

           
           

        
            const category = await Category.find();
            
            const cartCheckout = await updateTotal(req)
           
            const selectedItems = cartCheckout.items.filter(item => item.selected === false);
           

            let selectedAddressTypes = []; 

            if (addresses) {
                selectedAddressTypes = addresses.addresses.map((address) => address.addressType);
            }
          
            const billTotal = selectedItems.reduce((total, item) => total + item.price, 0);
            let discountPrice = null;
           let discountedTotal=null

            let successFull = ''
            let total = ''
            let subTotal = ''
            if (req.session.coupon ) {
              if(billTotal <= req.session.coupon.minPurchase){
               var minPurchaseMesage = `Sorry this coupon minimum purchase is ${req.session.coupon.minPurchase} `
              }else{
               var minPurchaseMesage = null;
              console.log(req.session.coupon.minPurchase);
              console.log('Original billTotal:', billTotal);
              subTotal = billTotal
              billTotal = billTotal - (billTotal * req.session.coupon.minDiscountPercentage)/100 ;    
              total = (billTotal * req.session.coupon.minDiscountPercentage)/100;
              req.session.billTotal = billTotal
              var code  =  req.session.coupon.couponCode
              successFull = `Coupon applied ${req.session.coupon.minDiscountPercentage}% OFF successfull`
              }
            } 
            console.log('jsadhasdjjafdgjgdfa'+req.session.coupon);
            // req.session.coupon = null
            const itemCount = selectedItems.length;


            let flag = 0
            Promise.all(selectedItems.map(async (item, index) => {
                let stock = await Product.findById(item.productId)
                console.log(item.quantity, stock.countInStock);
                if (item.quantity > stock.countInStock) {
                    flag = 1
                    selectedItems[index].quantity = stock.countInStock
            
                    cartCheckout.items.map(async (prod, i) => {
                        if (prod.productId + "" === selectedItems[index].productId + "") {
                            cartCheckout.items[i].quantity = stock.countInStock
                            console.log("before saving    ==");
                            await cartCheckout.save()
                        }
                    })
                   
                }

            })).then(() => {
               
                if (flag === 1) {
                    flag = 0

                    res.render('checkout', {
                        user, category, addresses, selectedItems, billTotal, itemCount, Adreessmessage, discountPrice,
                        discountedTotal,
                       selectedAddressTypes,  userDetail, err: true,coupon
                    })
                } else {

                    res.render('checkout', {
                        user, category, addresses, selectedItems, billTotal, itemCount, Adreessmessage, discountPrice,
                        discountedTotal,
                         selectedAddressTypes,  userDetail, err: '',coupon
                    })
                }
            })


        } else {
            res.redirect('/cart')
        }
    } catch (err) {
        console.log(err);
        next(err);
    }
}

function generateRandomOrderId(length) {
    let result = '';
    const characters = '0123456789'; // Digits

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }

    return 'OD_' + result;
}

let checkoutPost = async (req, res, next) => {
    try {
       
        if (!req.body.paymentOption || !req.body.addressType) {
           
            return res.status(400).json({ success: false, error: "Invalid data in the request" });
        }

        const cart = await Cart.findOne({ owner: req.session.user_id })

        if (!cart || cart.items.length === 0) {
            
            return res.status(400).json({ success: false, error: "No items in the cart" });
        }

        let selectedItems = cart.items.filter((item) => item.selected === false);

        const orderedItems = await Order.find({
            user: req.session.user_id,
            items: { $elemMatch: { productId: { $in: selectedItems.map(item => item.productId) } } }
        });

        if (orderedItems.length > 0) {
            selectedItems = selectedItems.filter(item => !orderedItems.some(orderedItem =>
                orderedItem.items.some(orderedItemItem => orderedItemItem.productId === item.productId)
            ));
        }

        const Address = await AddressModel.findOne({ user: req.session.user_id });


        if (!Address) {
            
            return res.status(400).json({ success: false, error: "User has no address" });
        }
        console.log('Address' + Address)
        const deliveryAddress = Address.addresses.find(
            (item) => item.addressType === req.body.addressType
        );

        if (!deliveryAddress) {
            
            return res.status(400).json({ success: false, error: "Address not found" });
        }
        const orderAddress = {
            addressType: deliveryAddress.addressType,
            HouseNo: deliveryAddress.HouseNo,
            Street: deliveryAddress.Street,
            Landmark: deliveryAddress.Landmark,
            pincode: deliveryAddress.pincode,
            city: deliveryAddress.city,
            district: deliveryAddress.district,
            State: deliveryAddress.State,
            Country: deliveryAddress.Country,
        };
        

        let billTotal = selectedItems.reduce((total, item) => total + item.price, 0);
        console.log(billTotal, selectedItems);


        if (req.body.paymentOption === "cashOnDelivery") {

            if(  req.session && req.session.discountedTotal && req.session.discountAmount && req.session.discountAmount!=null &&  req.session.discountedTotal!=null){
                billTotal = req.session.discountedTotal
              
                
               
              }
            const orderIds = await generateRandomOrderId(6);
        
            const orderData = new Order({
                user: req.session.user_id,
                cart: cart._id,
                orderId: orderIds,
                items: selectedItems,
                billTotal,
                paymentStatus: 'Success',
                orderId: orderIds,
                paymentId: null,
                paymentMethod: req.body.paymentOption,
                deliveryAddress: orderAddress,
                discounts : req.session.discountedTotal ? [
                    {
                      code:req.session.couponCode,
                     amount:req.session.discountAmount,
                     discountType:'Coupon',
                     coupon:req.session.couponId?req.session.couponId: null,
                    }
                   ]:[]
           
            });

            
        for (const item of selectedItems) {
            const product = await Product.findOne({ _id: item.productId });

            if (product) {
              
                console.log(item.quantity, product.stock);
                if (product.stock >= item.quantity) {
                  
                    product.stock -= item.quantity;
                    console.log(product.countInStock)
                    await product.save();
                } else {
                 
                    console.log("pppppp")
                    return res.status(400).json({ success: false, error: "Not enough stock for some items" });
                }
            } else {
                
                return res.status(400).json({ success: false, error: "Product not found" });
            }
        }

        const order = new Order(orderData)
                      await order.save()
                        req.session.couponCode= null
                        req.session.discountAmount = null
                        req.session.discountedTotal =null
                        req.session.couponId=null
          

            
            cart.items = cart.items.filter((item) => item.selected);
            cart.billTotal = 0
            await cart.save();

           
            const orderId = order._id;

            return res.status(201).json({ success: true, message: 'order placed successfully', orderId });

       
   
     }else if(req.body.paymentOption === 'Razorpay'){
        console.log('.jjjjjjjj');
        if(  req.session && req.session.discountedTotal && req.session.discountAmount && req.session.discountAmount!=null &&  req.session.discountedTotal!=null){
            billTotal = req.session.discountedTotal
          }
        const orderIds = await generateRandomOrderId(6);

        const amount = billTotal * 100; 

        const orderData = new Order({
          user: req.session.user_id,
          cart: cart._id,
          orderId: orderIds,
          items: selectedItems,
          billTotal,
          paymentStatus: 'Success',
          paymentMethod: req.body.paymentOption,
          deliveryAddress: orderAddress,
        });
        console.log(orderData);
        const order = new Order(orderData);
        const options = {
          amount,
          currency: 'INR',
          receipt: 'order',
        };
        console.log(options);
  
        razorpayInstance.orders.create(options, async (err, razorpayOrder) => {
          if (!err) {
            order.orderId = razorpayOrder.id;
            console.log('sfdgdfg');
            console.log(order.orderId);
  
            try {
              req.session.order = order;
              req.session.billTotal = null;
              res.status(201).json({
                success: true,
                msg: 'Order Created',
                order,
                amount,
                key_id: process.env.RAZORPAY_KEY_ID,
                contact: req.session.user_id.phoneNum,
                name: req.session.user_id.userName,
                email: req.session.user_id.email,
                address: `${orderAddress.addressType}\n${orderAddress.HouseNo} ${orderAddress.Street}\n${orderAddress.pincode} ${orderAddress.city} ${orderAddress.district}\n${orderAddress.State}`,
              });
  
            } catch (saveError) {
              console.error('Error saving order to the database:', saveError);
              return res.status(400).json({
                success: false,
                msg: 'Failed to save order'
              });
            }
          } else {
            console.error('Error creating Razorpay order:', err);
            return res.status(400).json({
              success: false,
              msg: 'Something went wrong!'
            });
          }
        });
     }
     else {
            return res.status(400).json({ success: false, error: 'Invalid payment option' });
        }

    } catch (err) {
        console.error(err);
        next(err);
    }
}
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_KEY_SECRET
  })

const userEditAddress = async(req,res)=>{
    try{
  
      const {
        addressType,
        HouseNo,
        Street,
        Landmark,
          pincode,
          city,
          district,
          state,
          Country
      } = req.body;
     console.log(req.body)
      const userId = req.session.user_id
  
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
      }
      const addresses = await AddressModel.findOne({user:userId})
    
      if(!addresses){
        return res.status(404).json({ success: false, message: 'Addresses not found' });
      }
      
          
          const addressToEdit = addresses.addresses.find(addr => addr.addressType === addressType);
  
          if (!addressToEdit) {
              return res.status(404).json({ success: false});
          }
  
          addressToEdit.HouseNo = HouseNo;
          addressToEdit.Street = Street;
          addressToEdit.Landmark = Landmark;
          addressToEdit.pincode = pincode;
          addressToEdit.city = city;
          addressToEdit.district = district;
          addressToEdit.State = state;
          addressToEdit.Country = Country;
  
         
          await addresses.save();
  
          res.status(200).redirect('/cart/checkout');
  
    }catch(err){
      console.error(err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

let orderConfirmation = async (req, res) => {
    const orderId = req.params.orderId;
   
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(404).json({ message: "error" })
    }

    try {
        req.session.checkout = false
        let orderDetails = await Order.findById(orderId)
        if (!orderDetails) {
            return res.status(404).json({ message: "error" })
        }

        res.render('orderconfirmation')
    } catch (err) {
        console.log(err);

    }
}

let razorpayVerify = async (req, res) => {
    try {
      console.log("VERIFY EYE/////////////////////////////");
      const body = req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
      console.log(body);
  
      const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');
  
      if (expectedSignature === req.body.razorpay_signature) {
        console.log("Corrected Verify");
        const order = new Order(req.session.order);
        await order.save();
        const updatedOrder = await Order.findOneAndUpdate({
          orderId: req.body.razorpay_order_id
        }, {
          paymentId: req.body.razorpay_payment_id,
          signature: req.body.razorpay_signature,
          paymentStatus: "Success",
        }, {
          new: true
        });
        console.log(updatedOrder)
        if (updatedOrder) {
          const cart = await Cart.findOne({
            owner: req.session.user_id
          });
          console.log(cart)
          cart.items = cart.items.filter((item) => item.selected);
          cart.billTotal = 0;
          await cart.save();
          return res.json({
            success: true,
            message: 'Order Sucessfully',
            updatedOrder
          })
        } else {
          return res.json({
            success: false,
            message: 'Order Failed Please try Again'
          })
        }
      } else {
        return res.json({
          success: false,
          message: 'Order Failed Please try Again'
        })
      }
    } catch (err) {
      console.log(err);
      return res.render('paymentFailed', {
        title: "Error",
        error: "An error occurred during payment verification",
      });
    }
  };
  
  const whishlistAddtoCart = async (req, res , next) => {
    try {
      console.log('mssaaaaaaaaaaaaaaaaaaaaaaaaaa');
      console.log(req.session.user_id, req.body.productId);
      if (req.session.userId != false) {
        let {
          userId,
          productId,
        } = req.body;
        console.log("if worked");

        const product = await Product.findById(productId);

        console.log(product);
        if (!product) {
          return res.status(404).render('page-not-found');
        }
        if (product.quantity == 0) {
          res.status(500)
          next()
        }
        const userData = await User.findById(userId);
        console.log(userData);
        if (!userData) {
          res.status(500)
          next()
        }

        const cart = await Cart.findOne({
          owner: userId
        });
        if (!cart) {
          await Cart.insertMany([
            {
              owner: userId,
              items: [{
                productId: new mongoose.Types.ObjectId(productId),
                productPrice: product.price,
                quantity: 1,
                price: product.price,
                name: product.name,
                image: product.coverimage,
              }],
              billTotal: product.price
            } 
          ]) 
          await whislistModel.findOneAndUpdate(
            { user: userId },
            { $pull: { items: { product: productId } } }
          );
          res.status(200).json({
            success: true,
            message: "Item added to cart"
          });
        } else {
          const cartItem = cart.items.find(item => item.productId.equals(productId));

          if (cartItem) {
            cartItem.productPrice = product.price;
            cartItem.quantity += 1;
            cartItem.price = cartItem.quantity * product.price;
          } else {
            cart.items.push({
              productId: productId,
              productPrice: product.price,
              quantity: 1,
              price: product.price,
              name: product.name,
              image: product.coverimage,
            });
          }
        

          await cart.save();
          await whislistModel.findOneAndUpdate(
            { user: userId },
            { $pull: { items: { product: productId } } }
          );
          res.status(200).json({
            success: true,
            message: "Item added to cart"
          })
        }
      } else {
        console.log("else worked");
      }
    } catch (error) {
      console.log(error.message);
      res.status(500)
      next()
    }
  }


const addToWHislist = async (req, res ,next) => {
  try {
    console.log("mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm");
    
      console.log("usfguesihteyuhregtfgesuifysgeuyfguesygjfyugesyufgsyufguesgfuygyufgyueegfyugsyudfgyusdg");
      const {
        productId 
      } = req.body
      console.log(req.body);
      const userId = req.session.user_id;
      const product = await Product.findById(productId);
      if (!product) {
        res.status(404)
        next()
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404)
        next()
      }
      const whislist = await whislistModel.findOne({
        user: userId
      })
      if (!whislist) {
        console.log("ffffffffffffffffffffffffffffffff");
        const newWhislist = new whislistModel({
          user: userId,
          items: [{
            product: new mongoose.Types.ObjectId(productId),
            quantity: 1
          }]
        });
        await newWhislist.save();

        res.status(200).json({
          success: true,
          message: "Item added to whishlist"
        });
      } else {
        const whishlistitems = whislist.items.find(item => item.product.equals(productId));
        if (whishlistitems) {
          whishlistitems.productPrice = product.price;
        } else {
          whislist.items.push({
            product: productId,
            productPrice: product.price,
            quantity: 1,
            price: product.price
          });
        }
      }

      await whislist.save();

      res.status(200).json({
        success: true,
        message: "Item added to whishlist"
      })

   
  } catch (error) {
    console.log(error);
    res.status(500)
    next()
  }
}

const whislistGet = async (req, res , next) => {
  try {
    console.log('hjhgjghjfhjghjgghfghfghfghfg');
      let user = (req.session.email) ? await User.findOne({
        email: req.session.email
      }) : null;
      const whislist = await whislistModel.findOne({
        user: req.session.user_id
      })
      console.log(whislist);
      if (!whislist) {
        console.log('hhgjhgjhg');
        return res.render('whishlist', {
          whishlist: '',
          // userId: (user !== null) ? user._id : false
        });
      }

      for (const item of whislist.items) {
        let data = await Product.findById(item.product);
        if (data) {
          item.data = data;
          console.log('Product Data:', data); 
        }
      }

      return res.render('whishlist', {
        whishlist: whislist,
        userId: (user != null) ? user._id : false
      })
   
  } catch (error) {
    console.log(error.message);
    res.status(500)
    next()
  }
}


const whislistRemove = async (req, res,next) => {
  try {
    const userId = req.session.user_id;
    const product = req.params.product;
    const whislist = await whislistModel.findOne({ user: userId });
console.log("hdffffffffffffffffffffffffffffffffffff");
    if (!whislist) {
      res.status(404)
      next()
    }

    const productIndex = whislist.items.findIndex((item) => item.product.toString() === product.toString());
     console.log(productIndex);
    if (productIndex !== -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in the wishlist',
      });
    }

    whislist.items.splice(productIndex , 1);

    await whislist.save();

    return res.status(200).json({
      success: true,
      message: 'Product removed from the wishlist',
    });
  } catch (error) {
    console.log(error.message);
    res.status(500)
    next()
  } 
};
const CouponApply = async (req, res , next) => {
  try {
    const couponCode = req.body.couponData;
    console.log(couponCode);
    const today = new Date();

    const coupon = await Coupon.findOne({
      couponCode: couponCode,
      status: 'Active',
      validity: { $gte: today }
    });
    if (!coupon) {
      return res.status(201).json({
        success: false,
        message: "Coupon already applied",
      });
    }
    console.log(coupon);

    if (coupon) {
      req.session.coupon = coupon;
      req.session.coupon.couponCode = coupon.couponCode
      res.status(200).json({
        success: true,
      });
    } else {
      req.session.discountedTotal = 0;
      res.status(200).json({
        success: false,
        message: "Invalid coupon code",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500)
    next()
  }
};



  
module.exports = {
    cartAdd,
    cartGet,
    cartPut,
    cartRemove,
    cartbillTotalUpdate,
    checkverify,
    checkoutGet,
    checkoutPost,
    orderConfirmation,
    userEditAddress,
    razorpayVerify,
    whislistGet,
    addToWHislist,
    whishlistAddtoCart ,
    whislistRemove,
    CouponApply
    
}

