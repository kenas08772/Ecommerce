const mongoose = require('mongoose')
const User = require('../models/userModels');
const ProductModel = require('../models/productModels')
const categoryModel = require('../models/categoryModel')
const AddressModel = require('../models/adressmodels')
const OrderModel = require('../models/oderdetails')
const Swal = require('sweetalert2'); // Include SweetAlert library
const PDFDocument = require('pdfkit');
const easyinvoice = require('easyinvoice');
const fs = require('fs')
const {
  Readable
} = require('stream')
const ejs = require('ejs');
const path = require('path')
const puppeteer = require('puppeteer')
const nodemailer = require('nodemailer')


const {
  sendOtp
} = require('../models/nodeMailer');
const {
  log
} = require('console');
const {
  productList
} = require('./adminControllers');
const Products = require('../models/productModels');
const {
  Console
} = require('console');
const Order = require('../models/oderdetails');





const loginGet = async (req, res) => {
  try {
    let err = (req.session.isBlocked) ? 'Sorry User Blocked' : ''
    req.session.user_id = null
    res.render('userLogin', {
      message: '',
      errMessage: err
    })
  } catch (error) {
    console.log(error);

  }
}



const signupGet = async (req, res) => {
  try {
    res.render("createUser", {
      message: "",
      errMessage: ""
    })
  } catch (error) {
    console.log(error);
  }
}





//  createing a user

const signupPost = async (req, res) => {
  try {
    const email = req.body.email
    const password = req.body.password
    const checkData = await User.findOne({
      email: email
    })
    if (checkData) {
      res.render("userLogin", {
        errMessage: "User Already Found....",
        message: ""
      })
    } else {
      const user = new User({
        userName: req.body.userName,
        email: req.body.email,
        phoneNum: req.body.phoneNum,
        password: req.body.password
      })

      req.session.otp = sendOtp(user.email);
      req.session.userData = user
      console.log(email, req.body.email)
      console.log(password, req.body.password)


      res.redirect("/otp");
    }
  } catch (err) {
    console.log(err);
  }
}

//otp


const loadOtp = (req, res) => {
  if (req.session.otpError) {
    req.session.otpError = null
    res.render('otp', {
      err: "Incorrect otp"
    })
  } else if (req.session.userData) {
    res.render("otp", {
      err: ""
    });
  } else {
    res.redirect("/mainPage")
  }
}







const verifyOtp = async (req, res) => {
  try {
    if (req.body.otp) {
      if (req.session.otp === req.body.otp) {
        const newuser = new User(req.session.userData);
        await newuser.save();
        console.log(newuser);

        res.redirect("/login");
      } else {

        console.log(`Incorrect OTP entered: ${req.body.otp}`);

        req.session.otpError = req.body.otp
        return res.redirect("/otp");
      }
    } else {

      return res.status(400).send("Enter the OTP");
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
};





// Verifying a User
const loginPost = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({
      email: email
    });

    if (userData) {
      if (userData.password === password) {
        req.session.user_id = userData._id;
        req.session.email = req.body.email;

        res.json({
          success: true
        });
      } else {
        res.json({
          success: false,
          message: 'Incorrect password.'
        });
      }
    } else {
      res.json({
        success: false,
        message: 'User does not exist.'
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: `Internal Server Error: ${err.message}`
    });
  }
};







const userLogout = async (req, res) => {
  try {
    req.session.user_id = null;
    res.redirect('/login');
  } catch (error) {
    console.log(error.message);
  }
}


const forgotGet = async (req, res) => {
  if (req.session.message) {
    req.session.message = null
    res.render('forgotpassword', {
      message: 'Not registerd email'
    })
  } else {
    res.render('forgotpassword', {
      message: ''
    })
  }

}


const forgotpasswordPost = async (req, res) => {

  const {
    email
  } = req.body

  const emailData = await User.findOne({
    email: email
  })
  console.log(emailData)
  if (!emailData) {
    req.session.message = true
    return res.render('forgotpassword')
  }

  req.session.Email = emailData.email
  console.log(req.session.Email + "1")
  const link = 'http://localhost:5000/resetPassword'
  console.log(link)


  // Send email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "kenasbiju2@gmail.com",
      pass: "ipif twcn avah mjpp"
    }

  });

  const mailOptions = {
    from: "kenasbiju2@gmail.com", // replace with your email
    to: emailData.email,
    subject: 'Password Reset Link',
    text: `Click the following link to reset your password: ${link}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return res.status(500).send('Internal Server Error');
    }
    console.log('Email sent: ' + info.response);

  });
  return res.redirect('/forgotPassword')

}

const resetPassword = async (req, res) => {
  try {
    res.render('resetPassword')
  } catch (error) {
    console.log(error.message)
  }
}
const resetPost = async (req, res) => {
  console.log('hjhjjkgjkghjkggjhgjhgjhgjhgjh')
  const userEmail = req.session.Email
  const userData = await User.findOne({
    email: userEmail
  })
  userData.password = req.body.newPassword
  userData.save();
  req.session.Email = null
  res.redirect('/login')
}


const home = async (req, res) => {
  console.log(req.session.user_id, req.session.email);
  try {

    const products = await ProductModel.find({
        isListed: true
      })
      .populate({
        path: "category",
        select: "name",
      });


    const totalProducts = products.length


    const categories = await categoryModel.find();


    if (req.session.user_id) {

      const userData = await User.findOne({
        _id: req.session.user_id
      });


      if (!userData.isBlocked) {

        res.render("mainPage", {
          userEmail: userData.email,
          products: products,
          categories,
          totalProducts,

        });
      } else {

        req.session.isBlocked = true;
        return res.redirect('/login');
      }
    } else {

      res.render("mainPage", {
        userEmail: null,
        products: products,
        categories,
        totalProducts,

      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Some error occurred while rendering the home page",
    });
  }
};

const homePage = async (req, res) => {
  try {
    const products = await ProductModel.find({
        isListed: true
      })
      .populate({
        path: "category",
        select: "name",
      });


    const totalProducts = products.length


    const categories = await categoryModel.find();


    if (req.session.email) {

      const userData = await User.findOne({
        email: req.session.email
      });
      console.log('//////////////////');

      if (!userData.isBlocked) {

        res.render("mainPage", {
          userEmail: userData.email,
          products: products,
          categories,
          totalProducts,

        });
      } else {

        req.session.isBlocked = true;
        return res.redirect('/login');
      }
    } else {
      res.redirect('/login')
    }
  } catch (error) {
    console.log(error)
  }
}






const userShop = async (req, res) => {
  try {
    const search = (req.query.search) ? new RegExp('^' + req.query.search, 'i') : ''
    let sort = {_id:1}
    console.log(req.query.sort);
    if(req.query.sort) {
      if(req.query.sort === 'low') sort = {price:1}
      else if (req.query.sort === 'high') sort = {price:-1}
      else if (req.query.sort === 'new') sort = {_id:-1}
      else if (req.query.sort === 'relevance') sort = {_id:1} 
    } 
    console.log(sort);
    let products = []
    if (search != '') {
      products = await ProductModel.find({
          name: search
        }).sort(sort)
        .populate({
          path: "category",
          select: "name",
        });
    } else {
      products = await ProductModel.find({}).sort(sort)
      .populate({
        path: "category",
        select: "name",
      });
    }
    const totalProducts = products.length

    const categories = await categoryModel.find();

    const selectedCategory = req.query.category;
    res.render("shop", {

      products,
      categories,
      totalProducts,
      userEmail: req.session.email,
      selectedCategory: req.query.category,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Some error caused while rendering shop page",
    });
  }
};





const ProductDetailedView = async (req, res) => {
  try {
    const email = req.session.email ? true : false
    const id = req.params.productId;
    const product = await ProductModel.findById(id);

    const category = await categoryModel.find({});
    const products = [product]

    res.render('Product-details', {
      products,
      email,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Internal Server Error',
      errorMessage: error.message
    });
  }
}

const userOrderDetails = async (req, res) => {
  try {
    const ITEMS_PER_PAGE = 5;
    let page = parseInt(req.query.pageNumber) || 1;
    const orders = await OrderModel.find({
        user: req.session.user_id
      })
      .sort({
        createdAt: -1
      })
      .skip((ITEMS_PER_PAGE * page) - ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
    const totalOrders = await OrderModel.countDocuments({
      user: req.session.user_id
    });
    const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE);
    const paginationInfo = {
      currentPage: page,
      totalPages: totalPages,
    };
    console.log(orders)
    console.log(paginationInfo)
    return res.status(200).send({
      orders,
      paginationInfo
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Some thing Causes in server' + err
    })
  }
}

const editProfile = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const UpdateUser = await User.findById(userId);
    if (req.file) {
      const newImage = req.file.path.replace(/\\/g, '/').replace('public/', '');
      UpdateUser.image = newImage;
    }
    await UpdateUser.save()
    return res.redirect('/userProfile');

  } catch (error) {
    console.log(error.message);
  }
}



const userProfileGet = async (req, res) => {
  try {
    let user = req.session.user_id ? true : false;
    const category = await categoryModel.find({
      status: true
    })
    console.log("address")
    const addresses = await AddressModel.findOne({
      user: req.session.user_id
    });

    const orderDetails = await OrderModel.find({
      user: req.session.user_id
    }).sort({
      createdAt: -1
    })

    let errorValue;
    if (req.session.OldPassword) {
      errorValue = 'Old password is incorrect'
      req.session.OldPassword = null
    } else {
      errorValue = ''
    }
    const [userDetails] = await User.aggregate([{
        $match: {
          _id: new mongoose.Types.ObjectId(req.session.user_id),
        },
      },
      {
        $lookup: {
          from: 'wallets',
          localField: 'wallet',
          foreignField: '_id',
          as: 'WalletDetails',
        },
      },
      {
        $limit: 1,
      },
    ]);





    res.status(200).render('userprofile', {
      category,
      user,
      addresses,
      userDetails,
      orderDetails,
      errorValue
    })
  } catch (err) {
    console.log(err);
    res.status(500).render('500error', {
      message: 'Internal server error' + err
    });
  }
}



const changePassword = async (req, res) => {
  try {
    const userId = req.session.user_id
    const {
      oldPassword,
      newPassword
    } = req.body
    console.log(oldPassword, newPassword)
    const user = await User.findOne({
      _id: userId
    })
    console.log(user);
    if (oldPassword == user.password) {
      user.password = newPassword
      await user.save()
      req.session.user_id = null
      res.redirect('/login')
    } else {
      req.session.OldPassword = true
      res.redirect('/userProfile')
    }

  } catch (error) {
    console.log(error.message);
  }
}


const userAddAddress = async (req, res) => {
  try {

    const {
      addressType,
      houseNo,
      street,
      landmark,
      pincode,
      city,
      district,
      state,
      country
    } = req.body;

    const userId = req.session.user_id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }


    let useraddresses = await AddressModel.findOne({
      user: userId
    });

    if (!useraddresses) {

      useraddresses = new AddressModel({
        user: userId,
        addresses: []
      });
    }


    const existingAddress = useraddresses.addresses.find((address) =>
      address.addressType === addressType &&
      address.HouseNo === houseNo &&
      address.Street === street &&
      address.pincode === pincode &&
      address.city === city &&
      address.State === state &&
      address.Country === country
    );

    if (existingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Address already exists for this user'
      });
    }

    if (useraddresses.addresses.length >= 3) {
      return res.status(400).json({
        success: false,
        message: 'User cannot have more than 3 addresses',
      });
    }


    const newAddress = {
      addressType: addressType,
      HouseNo: houseNo,
      Street: street,
      Landmark: landmark,
      pincode: pincode,
      city: city,
      district: district,
      State: state,
      Country: country,
    };

    useraddresses.addresses.push(newAddress);


    await useraddresses.save();


    res.status(200).json({
      status: true,
      message: 'Address added successfully'
    });
  } catch (err) {
    if (err.name === 'ValidationError') {

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: err.errors
      });
    } else {
      console.log(err);
      res.status(500).render('500error', {
        success: false,
        message: 'Internal Server Error'
      });
    }
  }
};


const userEditAddress = async (req, res) => {
  try {

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
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    const addresses = await AddressModel.findOne({
      user: userId
    })

    if (!addresses) {
      return res.status(404).json({
        success: false,
        message: 'Addresses not found'
      });
    }


    const addressToEdit = addresses.addresses.find(addr => addr.addressType === addressType);

    if (!addressToEdit) {
      return res.status(404).json({
        success: false
      });
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

    res.status(200).redirect('/userProfile');

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

const userdeleteAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    const addresses = await AddressModel.findOne({
      user: userId
    })

    if (!addresses) {
      return res.status(404).json({
        success: false,
        message: 'Addresses not found'
      });
    }

    const addressTypeToDelete = req.query.addressType;

    const addressIndexToDelete = addresses.addresses.findIndex((address) => address.addressType === addressTypeToDelete);

    if (addressIndexToDelete === -1) {
      return res.status(404).json({
        success: false
      });
    }

    addresses.addresses.splice(addressIndexToDelete, 1);

    await addresses.save();

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (err) {
    next(err);
  }
}

const userDetailEdit = async (req, res) => {
  try {
    const {
      firstName,
      email,
      gender,
      mobile
    } = req.body;
    console.log(req.body)
    if (!firstName || !email || !gender || !mobile) {
      return res.status(400).json({
        error: 'All fields are required.'
      });
    }


    const userId = req.session.user_id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Authentication is Required'
      })
    }
    console.log(user)

    user.userName = firstName;
    user.email = email;
    user.gender = gender;
    user.phoneNum = mobile;
    await user.save();

    return res.status(200).redirect('/userProfile')
  } catch (err) {
    console.log(err);
    next(err)
  }
}



const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const {
      reason
    } = req.body

    const order = await OrderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found"
      });
    }


    const canceledProducts = order.items;

    console.log(canceledProducts)

    for (const product of canceledProducts) {
      const productId = product.productId;
      const quantity = product.quantity;


      const productToUpdate = await Product.findById(productId);

      if (!productToUpdate) {
        return res.status(404).json({
          success: false,
          error: "Product not found for restocking",
        });
      }

      productToUpdate.countInStock += quantity;


      await productToUpdate.save();
    }

    if (order.paymentMethod === 'cashOnDelivery') {
      order.status = 'Canceled'
      order.requests.push({
        type: 'Cancel',
        status: 'Accepted',
        reason,
      });
      await order.save();
    } else {

      order.status = 'Canceled'
      order.requests.push({
        type: 'Cancel',
        status: 'Pending',
        reason,
      });
      await order.save();
    }
    return res.json({
      success: true,
      message: "Order canceled successfully"
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

const order = async (req, res) => {
  try {
    const orderDetails = await OrderModel.find({
      user: req.session.user_id
    })
    res.render('orderList', {
      orderDetails
    })

  } catch (error) {
    console.error(error);
  }
}
const ordercancel = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const order = await OrderModel.findOne({
      orderId: id
    })
    console.log(order);
    if (order) {
      order.status = 'Canceled'
      await order.save()
      res.redirect('/userProfile')
    }
  } catch (error) {
    console.log(error.message);
  }
}
const removeAddress = async (req, res) => {
  try {
    const userId = req.session.user_id
    const order = await Order.findOne({
      user: userId
    })
    const type = req.params.type
    console.log(type)
    const result = await AddressModel.findOneAndUpdate({
      user: userId
    }, {
      $pull: {
        addresses: {
          addressType: type
        }
      }
    }, {
      new: true
    });
    res.redirect('/userProfile')


  } catch (error) {
    console.log(error.message);
  }
}




const usergetOrderInvoice = async (req, res, next) => {
  try {
    // if (req.query.from === '$2b$10$gviVtGpDfqpsAsCkbx8xaukeIQDirbAk2vIJ0IhJROGzYHeHUERp2') {

    const order = await OrderModel.findById(req.params.orderId).populate('user', 'firstName lastName email');


    console.log("innn")
    console.log(order, order ?.items);
    let products = order.items.map((item, index) => {
      return {
        "quantity": item.quantity,
        "price": item.productPrice,
        "tax-rate": 0.0,
        "description": item.name,
      }
    });


    var data = {
      "customize": {},
      "images": {
        "logo": "https://public.easyinvoice.cloud/img/logo_en_original.png",
        // "background": "https://public.easyinvoice.cloud/img/watermark-draft.jpg"
      },
      "sender": {
        "company": "Fstore",
        "address": "Fstore Website",
        "zip": "680502",
        "city": "Thrissur",
        "country": "INDIA"
      },
      "client": {
        "company": order.user.firstName + ' ' + order.user.lastName || "N/A",
        "address": order.deliveryAddress.HouseNo + ' ' + order.deliveryAddress.Street + ' ' + order.deliveryAddress.city,
        "city": order.deliveryAddress.city,
        "zip": "PIN :" + order.deliveryAddress.pincode,

        "country": order.deliveryAddress.Country,
      },
      "information": {

        "date": order.orderDate,
        "due-date": "PAID"
      },
      "products": products,
      "bottom-notice": "Thank you for supporting us, Inloop Watches",
      "settings": {
        "currency": "INR",
      },
      "translate": {},
    };
    easyinvoice.createInvoice(data, function (result) {
      const base64Data = result.pdf;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="INVOICE_' + Date.now() + '_.pdf"');
      const binaryData = Buffer.from(base64Data, 'base64');
      res.send(binaryData);
    });
    // } 
    // else {
    //     res.redirect('/profile')
    // }

  } catch (error) {
    console.error(error);
    console.log(error);
    next(error);
  }

}
const Invoice = async (req, res, next) => {
  try {
    console.log('hjh');
    const orderId = req.params.orderId;
    const user = await User.findOne({
      _id: req.session.userId
    });
    const order = await OrderModel.findOne({
      _id: orderId
    })
    var products = [];
    order.items.forEach((item) => {
      products.push({
        description: item.name,
        quantity: item.quantity,
        "tax-rate": 0,
        price: item.price,
      });
    });

    var data = {
      customize: {},
      images: {
        background: "https://public.easyinvoice.cloud/img/watermark-draft.jpg",
      },

      sender: {
        company: "LACE MIST",
        address: "KOCHI",
        zip: "686633",
        city: "maradu",
        country: "india",
      },

      client: {
        company: "Kenas",
        address: order.deliveryAddress.district,
        zip: order.deliveryAddress.pincode,
        city: order.deliveryAddress.city,
        country: order.deliveryAddress.Country,
      },

      information: {
        orderId: orderId,
        date: order.createdAt.toLocaleString(),
        "due-date": "Nil",
      },
      products: products, // Format billTotal to 2 decimal places
      "bottom-notice": "Thank you, Keep shopping.",
    };

    easyinvoice.createInvoice(data, async function (result) {
      // The response will contain a base64 encoded PDF file
      await fs.writeFileSync("invoice.pdf", result.pdf, "base64");

      // Set the response headers for downloading the file
      res.setHeader("Content-Disposition", 'attachment; filename="invoice.pdf"');
      res.setHeader("Content-Type", "application/pdf");

      // Create a readable stream from the PDF base64 string
      const pdfStream = new Readable();
      pdfStream.push(Buffer.from(result.pdf, "base64"));
      pdfStream.push(null);

      // Pipe the stream to the response
      pdfStream.pipe(res);
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500);
    next();
  }
};



module.exports = {
  home,
  loginGet,
  loginPost,
  forgotGet,
  signupGet,
  forgotpasswordPost,
  verifyOtp,
  loadOtp,
  signupPost,
  userLogout,
  userShop,
  ProductDetailedView,
  userProfileGet,
  userOrderDetails,
  cancelOrder,
  userDetailEdit,
  userdeleteAddress,
  userEditAddress,
  userAddAddress,
  changePassword,
  order,
  homePage,
  ordercancel,
  editProfile,
  removeAddress,
  usergetOrderInvoice,
  Invoice,
  resetPassword,
  resetPost
}