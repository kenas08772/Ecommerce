const User = require('../models/userModels')
const Admin = require('../models/adminModels')
const Category = require("../models/categoryModel")
const Products = require("../models/productModels")
const Order = require('../models/oderdetails')
const pdfMake = require('pdfmake/build/pdfmake.js');
const pdfFonts = require('pdfmake/build/vfs_fonts.js');
const ExcelJS = require('exceljs')
const { Coupon } = require('../models/couponModels')
pdfMake.vfs = pdfFonts.pdfMake.vfs;

function getDate(date, fullDay) {
    let currentDate = (!fullDay) ? new Date() : new Date(fullDay);
    currentDate.setDate(currentDate.getDate() + date);
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0') // Months are zero-based
    const day = String(currentDate.getDate()).padStart(2, '0')
    return day + '-' + month + '-' + year
}

const adminLoginGet = async (req, res) => {
    try {
        if (!req.session.admin_id) {
            res.render("adminLogin", {
                message: ""
            });
        } else {
            res.redirect('/admin')
        }

    } catch (err) {
        console.log(err.message);
    }
}

const adminLoginPost = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const adminData = await Admin.findOne({
            password: password,
            email: email
        })

        if (adminData) {
            if (adminData.password === password) {
                req.session.admin_id = adminData._id;
                res.redirect("/admin");
            } else {
                res.render("adminLogin", {
                    message: "Invalid Admin"
                });
            }
        } else {
            res.render("adminLogin", {
                message: "You are Not a Admin"
            });
        }


    } catch (err) {
        console.log(err.message);
    }
}

const dashboard = async (req, res) => {
    try {
        if (req.session.admin_id) {
            const today = getDate(0, false)
            const allProducts = await Products.find();
            const ordersToday = await Order.find({
                orderDate: today,
                status: 'Delivered'
            })
            let todaysRevenue = 0
            ordersToday.forEach((order) => {
                todaysRevenue += order.billTotal
            })
            const allCategories = await Category.find();
            const allOrders = await Order.find();
            const orders = await Order.find()
                .sort({
                    createdAt: -1
                })
                .populate('user')
                .exec();
            const userDetail = await User.findOne({
                _id: orders[0].user
            });
            const deliveredOrdersRev = allOrders.filter(order => order.status === 'Delivered');
            const productCount = allProducts.length;
            const categoriesCount = allCategories.length;
            const orderCount = allOrders.length;
            const currentDate = new Date();
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            const endOfWeek = new Date(currentDate);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

            const monthlyOrders = await Order.find({
                createdAt: {
                    $gte: startOfMonth,
                    $lte: endOfMonth
                },
            });

            const totalRevenue = deliveredOrdersRev.reduce((total, order) => {
                return total + order.billTotal;
            }, 0);

            const averageRevenue = orderCount > 0 ? totalRevenue / orderCount : 0;

            const deliveredOrders = monthlyOrders.filter(order => order.status == 'Delivered');
            const pendingOrders = monthlyOrders.filter(order => order.status !== 'Delivered');

            const monthlyEarnings = deliveredOrders.reduce((totalEarnings, order) => {
                return totalEarnings + order.billTotal
            }, 0)

            const weeklyOrders = await Order.find({
                createdAt: {
                    $gte: startOfWeek,
                    $lte: endOfWeek
                },
            });

            const weeklyOrderCount = weeklyOrders.length;
            const deliveredOrderCount = deliveredOrders.length;
            const pendingOrderCount = pendingOrders.length;
            const monthly = monthlyOrders.length;
            res.render("dashboard", {
                productCount,
                categoriesCount,
                orderCount,
                weeklyOrderCount,
                deliveredOrderCount,
                pendingOrderCount,
                totalRevenue,
                totalRevenue,
                monthlyEarnings,
                orders,
                userDetail,
                monthly,
                averageRevenue,
                ordersToday,
                todaysRevenue
            });
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
}

const excel = async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const orders = await Order.find({
            status: 'Delivered'
        });

        const worksheet = workbook.addWorksheet('Products');

        worksheet.columns = [{
                header: 'Order Id',
                key: 'id',
                width: 30
            },
            {
                header: 'Total Products',
                key: 'products',
                width: 15
            },
            {
                header: 'Order Date',
                key: 'date',
                width: 15
            },
            {
                header: 'Amount',
                key: 'revenue',
                width: 15
            }
        ];

        orders.forEach(order => {
            worksheet.addRow({
                id: order._id,
                products: order.items.length,
                date: order.orderDate,
                revenue: order.billTotal
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Excel.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error creating Excel file:', error.message);
        res.status(500).send('Internal Server Error');
    }
};


const checkcategory = async (req, res) => {
    const category = await Category.findOne({
        name: req.body.name
    })
    if (!category) return res.status(200).json({
        status: true
    })
    else return res.status(201).json({
        status: true
    })
}

const Salesreport = async (req, res) => {
    try {
        if (req.session.admin_id) {
            const allProducts = await Products.find();
            const allCategories = await Category.find();
            const allOrders = await Order.find();
            const orders = await Order.find()
                .sort({
                    createdAt: -1
                })
                .populate('user')
                .exec();
            const userDetail = await User.findOne({
                _id: orders[0].user
            });
            const deliveredOrdersRev = allOrders.filter(order => order.status === 'Delivered');
            const productCount = allProducts.length;
            const categoriesCount = allCategories.length;
            const orderCount = allOrders.length;
            const currentDate = new Date();
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            const endOfWeek = new Date(currentDate);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

            const monthlyOrders = await Order.find({
                createdAt: {
                    $gte: startOfMonth,
                    $lte: endOfMonth
                },
            });

            const totalRevenue = deliveredOrdersRev.reduce((total, order) => {
                return total + order.billTotal;
            }, 0);

            const averageRevenue = orderCount > 0 ? totalRevenue / orderCount : 0;

            const deliveredOrders = monthlyOrders.filter(order => order.status == 'Delivered');
            const pendingOrders = monthlyOrders.filter(order => order.status !== 'Delivered');

            const monthlyEarnings = deliveredOrders.reduce((totalEarnings, order) => {
                return totalEarnings + order.billTotal;
            }, 0);

            const weeklyOrders = await Order.find({
                createdAt: {
                    $gte: startOfWeek,
                    $lte: endOfWeek
                },
            });

            const weeklyOrderCount = weeklyOrders.length;
            const deliveredOrderCount = deliveredOrders.length;
            const pendingOrderCount = pendingOrders.length;
            const monthly = monthlyOrders.length;



            let docDefinition = {
                content: [{
                    text: `Sales Report
          
          `,
                    style: 'header'
                }],
                styles: {
                    header: {
                        fontSize: 20,
                        bold: true,
                        alignment: 'center'
                    },
                    tableExample: {
                        margin: [0, 5, 0, 15]
                    }
                }
            };
            docDefinition.content.push(
                `Total Revenue: INR ${totalRevenue.toFixed(2)}
          `,
                `Total Order Count: ${orderCount}
          `,
                ` Total Count In Stock: ${productCount}
         `,
                `Average Sales: ${averageRevenue ?averageRevenue.toFixed(2) : 'N/A'}
          `,
                `Average Revenue: ${averageRevenue ? averageRevenue.toFixed(2) : 'N/A'}
          `
            );

            let order = await Order.find({
                status: 'Delivered'
            });

            if (order && order.length > 0) {
                // Adding order details to PDF
                let rows = order.map(order => [
                    `#${order._id.toString()}`,
                    order.status,
                    order.orderDate.toLocaleString(),
                    order.paymentMethod,
                    `INR ${order.billTotal}`
                ]);

                docDefinition.content.push({
                    style: 'tableExample',
                    table: {
                        headerRows: 1,
                        body: [
                            ['OrderID', 'Status', 'Date', 'Payment Method', 'Total'],
                            ...rows
                        ]
                    }
                });
            } else {
                docDefinition.content.push('No order details available.');
            }

            const pdfDoc = pdfMake.createPdf(docDefinition);
            pdfDoc.getBuffer((buffer) => {
                res.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'attachment;filename="filename.pdf"'
                });
                res.end(buffer);
            });
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
}
const WeeklySales = async (req, res) => {
    try {
        if (req.session.admin_id) {
            const allProducts = await Products.find();
            const allCategories = await Category.find();
            const allOrders = await Order.find();
            const orders = await Order.find()
                .sort({
                    createdAt: -1
                })
                .populate('user')
                .exec();
            const userDetail = await User.findOne({
                _id: orders[0].user
            });
            const deliveredOrdersRev = allOrders.filter(order => order.status === 'Delivered');
            const productCount = allProducts.length;
            const categoriesCount = allCategories.length;
            const orderCount = allOrders.length;
            const currentDate = new Date();
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            const endOfWeek = new Date(currentDate);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

            const monthlyOrders = await Order.find({
                createdAt: {
                    $gte: startOfMonth,
                    $lte: endOfMonth
                },
            });

            const totalRevenue = deliveredOrdersRev.reduce((total, order) => {
                return total + order.billTotal;
            }, 0);

            const averageRevenue = orderCount > 0 ? totalRevenue / orderCount : 0;

            const deliveredOrders = monthlyOrders.filter(order => order.status == 'Delivered');
            const pendingOrders = monthlyOrders.filter(order => order.status !== 'Delivered');

            const monthlyEarnings = deliveredOrders.reduce((totalEarnings, order) => {
                return totalEarnings + order.billTotal;
            }, 0);

            const weeklyOrders = await Order.find({
                createdAt: {
                    $gte: startOfWeek,
                    $lte: endOfWeek
                },
            });

            const weeklyOrderCount = weeklyOrders.length;
            const deliveredOrderCount = deliveredOrders.length;
            const pendingOrderCount = pendingOrders.length;
            const monthly = monthlyOrders.length;



            let docDefinition = {
                content: [{
                    text: `Sales Report
          
          `,
                    style: 'header'
                }],
                styles: {
                    header: {
                        fontSize: 20,
                        bold: true,
                        alignment: 'center'
                    },
                    tableExample: {
                        margin: [0, 5, 0, 15]
                    }
                }
            };
            docDefinition.content.push(
                `Total Revenue: INR ${totalRevenue.toFixed(2)}
          `,
                `Total Order Count: ${orderCount}
          `,
                `Total Delivered Count: ${deliveredOrderCount}
          `,
                ` Total Count In Stock: ${productCount}
         `,
                `Average Sales: ${averageRevenue ?averageRevenue.toFixed(2) : 'N/A'}
          `,
                `Average Revenue: ${averageRevenue ? averageRevenue.toFixed(2) : 'N/A'}
          `
            );

            let order = await Order.find({
                status: 'Delivered'
            });

            if (order && order.length > 0) {
                // Adding order details to PDF
                let rows = order.map(order => [
                    `#${order._id.toString()}`,
                    order.status,
                    order.orderDate.toLocaleString(),
                    order.paymentMethod,
                    `INR ${order.billTotal}`
                ]);

                docDefinition.content.push({
                    style: 'tableExample',
                    table: {
                        headerRows: 1,
                        body: [
                            ['OrderID', 'Status', 'Date', 'Payment Method', 'Total'],
                            ...rows
                        ]
                    }
                });
            } else {
                docDefinition.content.push('No order details available.');
            }

            const pdfDoc = pdfMake.createPdf(docDefinition);
            pdfDoc.getBuffer((buffer) => {
                res.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'attachment;filename="filename.pdf"'
                });
                res.end(buffer);
            });
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
}

const AdminLougout = async (req, res) => {
    try {
        req.session.admin_id = null;
        return res.redirect("/admin/login");
    } catch (err) {
        console.log(err.message);
    }
}

const usersList = async (req, res) => {
    try {
        const search = req.query.search ? new RegExp('^' + req.query.search, 'i') : '';
        const users = await User.find({
            userName: {
                $regex: search
            }
        }).sort({
            userName: 1
        });
        res.render("usersList", {
            users
        });
    } catch (err) {
        console.log(err.message);
    }
}

const block = async (req, res) => {
    try {
        const userId = req.query.id;
        console.log(userId);
        const listUser = await User.findByIdAndUpdate(userId, {
            isBlocked: true
        });

        if (listUser) {
            res.redirect("/admin/users");
        } else {
            res.status(404).send("User Not Found");
        }
    } catch (err) {
        console.log(err);
    }
};

const unBlock = async (req, res) => {
    try {
        const userId = req.query.id;
        console.log(userId);
        const unlistUser = await User.findByIdAndUpdate(userId, {
            isBlocked: false
        });

        if (unlistUser) {
            res.redirect("/admin/users");
        } else {
            res.status(404).send("User not Found");
        }
    } catch (err) {
        console.log(err);
    }
};

const categories = async (req, res) => {
    try {
        const usersCatagory = await Category.find();

        res.render("usersCategories", {
            category: usersCatagory
        })
    } catch (err) {
        console.log(err);
    }
}

const addCategory = async (req, res) => {
    try {

        const {
            name,
            description
        } = req.body;
        const nameRegex = new RegExp(name, "i");
        const checkData = await Category.findOne({
            name: {
                $regex: nameRegex
            }
        });

        if (checkData) {
            const errMessage = "Category alredy exists";
            res.redirect(`/admin/categories?error=${encodeURIComponent(errMessage)}`)
        } else {
            const addingcategory = new Category({
                name: name,
                description: description
            })
            await addingcategory.save();

            res.redirect("/admin/categories")

        }


    } catch (error) {
        console.log(error);
    }
}
const blockCategory = async (req, res) => {
    try {
        const categoryId = req.query.id;

        const blocked = await Category.findByIdAndUpdate(categoryId, {
            isListed: false
        });
        const cat = await Category.findById(categoryId);
        if (blocked) {
            await Products.updateMany({
                category: cat.name
            }, {
                $set: {
                    isListed: false
                }
            });
            res.redirect("/admin/categories");
        } else {
            res.status(404).send("User Not Found......");

        }
    } catch (err) {
        console.log(err);
    }
}
const unBlockCategory = async (req, res) => {
    try {

        const categoryId = req.query.id;
        const unBlock = await Category.findByIdAndUpdate(categoryId, {
            isListed: true
        });

        const cat = await Category.findById(categoryId);
        if (unBlock) {
            await Products.updateMany({
                category: cat.name
            }, {
                $set: {
                    isListed: true
                }
            });
            res.redirect("/admin/categories");
        } else {
            res.status(404).send("User Not Find")
        }
    } catch (err) {
        console.log(err);
    }
}

const editCategory = async (req, res) => {
    try {
        const categoryId = req.query.id;
        const categoryData = await Category.findById(categoryId);
        console.log(categoryData);
        if (categoryData) {
            res.render("editCategory", {
                Category: categoryData
            })
        } else {
            return res.status(404).send("NOT AVAILABLE")
        }
    } catch (err) {
        console.log(err);
    }
}

const updatCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(req.body.id, {
            $set: {
                name: req.body.name,
                description: req.body.description
            }
        });

        res.redirect("/admin/categories");



    } catch (err) {
        console.log(err);
    }
}

const deleteCategory = async (req, res) => {
    try {
        const categoryid = req.query.id;
        const remove = await Category.findByIdAndDelete({
            _id: categoryid
        })
        if (remove) {
            res.redirect("/admin/categories");
        } else {
            res.send("NOT DELETED")
        }
    } catch (err) {
        console.log(err);
        if (err) {
            res.render("404page")
        }
    }
}

const productList = async (req, res) => {
    try {
        const product = await Products.find()
        res.render("productList", {
            product: product
        })
    } catch (err) {
        if (err) {
            res.render("404page")
        }
    }
}

const loadCreateingProduct = async (req, res) => {
    try {
        const category = await Category.find()

        res.render("loadCreateProductPage", {
            category
        });

    } catch (err) {
        if (err) {
            res.render("404Page");
            console.log(err);
        }
    }
}
const createProduct = async (req, res) => {
    try {
        const offer = req.body.offer
        let Price = req.body.price
        let value = 0;
        if (offer) {
            value = (offer / 100) * Price
        }
        
        Price -= value;
        const creatingProduct = {
            name: req.body.name,
            description: req.body.description,
            stock: req.body.stock,
            brand: req.body.brand,
            price: Price,
            category: req.body.category,
            coverimage: "/product/" + req.session.images[0],
            offer: offer,
            permanantPrice: Price,
            images: [
                "/product/" + req.session.images[1],
                "/product/" + req.session.images[2],
                "/product/" + req.session.images[3],


            ]
        };
        req.session.images = null
        await Products.insertMany([creatingProduct]);
        // req.session
        res.redirect("/admin/productList")

    } catch (error) {

        console.log(error);

    }
}

const blockProduct = async (req, res) => {
    try {
        const productId = req.query.id;
        const blocked = await Products.findByIdAndUpdate(productId, {
            isListed: true
        });

        if (blocked) {
            res.redirect("/admin/productList");
        } else {
            res.render("404page");
        }
    } catch (err) {
        console.log(err);
        if (err) {
            res.render("404page");
        }
    }
}

const unblockproduct = async (req, res) => {
    try {
        const productId = req.query.id;
        const unblock = await Products.findByIdAndUpdate(productId, {
            isListed: false
        });

        if (unblock) {
            res.redirect("/admin/productList");
        } else {
            res.render("404page");
        }
    } catch (err) {
        console.log(err);
        if (err) {
            res.render("404page");
        }
    }
}

const editProduct = async (req, res) => {
    try {
        const productId = req.query.id;


        const product = await Products.findById(productId).populate('category', '_id');


        const categories = await Category.find();

        res.render("editProduct", {
            product: product,
            categories: categories
        });

    } catch (err) {
        console.error(err);
        if (err) {
            res.render("404page");
        }
    }
}

const updateProduct = async (req, res) => {
    try {
        const product = await Products.findById(req.body.id);
        const offer = req.body.offer
        let Price = req.body.price
        let value = 0;
        if (offer) {
            value = (offer / 100) * Price
            Price = product.permanantPrice - value;
        }
        let updateFields = {
            name: req.body.name,
            description: req.body.description,
            stock: req.body.stock,
            brand: req.body.brand,
            price: Price,
            offer: offer,
            category: req.body.category,
        };


        console.log(req.session.images);
        if (req.session.images) {
            console.log('gsgfjdffdsgud');
            updateFields.coverimage = '/product/' + req.session.images[0];
            req.session.images = null;
        } else {
            updateFields.coverimage = product.coverimage
        }

        const updating = await Products.findByIdAndUpdate(req.body.id, {
            $set: updateFields
        });


        if (updating) {
            res.redirect('/admin/productList');
        } else {
            res.send("ERROR CHECK THE CODE");
        }



    } catch (err) {
        console.error(err);
        res.status(500).send(`Internal Server Error: ${err.message}`);
    }
}

const deletProduct = async (req, res) => {
    try {
        const product_id = req.query.id;
        const remove = await Products.findByIdAndDelete({
            _id: product_id
        });

        if (remove) {
            res.redirect("/admin/productList");
        } else {
            res.send("Product not found or could not be deleted.");
        }
    } catch (err) {
        console.error(err);
        res.render("404page");
    }
}

const orders = async (req, res) => {
    try {
        const order = await Order.find().sort({
            createdAt: -1
        }).populate('user');
        res.render('order', {
            order
        })
    } catch (error) {
        console.log(error.message);
    }
}

const orderdetails = async (req, res) => {
    try {

        const orderId = req.params.orderId;
        console.log(orderId + 'hsdfhjgs');
        const order = await Order.findOne({
            _id: orderId
        }).populate('user')
        res.render('orderDetails', {
            order
        })
    } catch (error) {
        console.log(error.message);
    }
}

const statuschange = async (req, res) => {
    try {
        console.log('sdfs')
        const id = req.params.status
        const status = req.body.status;
        const order = await Order.findOne({
            _id: id
        })
        console.log(order, status)
        order.status = status;
        order.save()
        res.status(200).json({
            success: true
        })
    } catch (error) {
        console.log(error.message);
    }
}
const categoryOffer = async (req, res) => {
    try {
        let categories = await Category.find({});
        res.render('category', {
            categories
        })
    } catch (error) {
        console.log(error.message);
    }
}
const categoryOfferCreate = async (req, res) => {
    try {
        const category = req.body.category;
        const offer = req.body.discount;

        let categories = await Category.findOne({
            _id: category
        });
        let name = categories.name

        if (!categories) {

            return res.status(404).send('Category not found');
        }
        let products = await Products.find({
            category: categories.name
        });


        products.forEach(async (product) => {
            const discountedPrice = product.permanantPrice - (product.permanantPrice * (offer / 100));
            product.price = discountedPrice;
            await product.save();
        });
        categories.offer = offer;
        await categories.save();

        res.redirect('/admin/categoryOffer');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};


const couponGet = async (req, res) => {
    try {
      let search = ''
      const page = parseInt(req.query.page) || 1;
      const pageSize = 5;
  
      const totalCoupons = await Coupon.countDocuments();
      const totalPages = Math.ceil(totalCoupons / pageSize);
  
      const coupons = await Coupon.find()
        .sort({ validity: 1 }) 
        .limit(pageSize)
        .skip((page - 1) * pageSize)
        .exec();
  
      res.render('coupon', { coupons, totalPages, currentPage: page , search });
    } catch (error) {
      console.error('Error fetching coupons:', error);
      res.status(500).send('Internal Server Error');
    }
  }



  const couponPost = async (req, res) => {
    try {
      const {
        couponCode,
        validity,
        minPurchase,
        minDiscountPercentage,
        discription,
      } = req.body;
      console.log(req.body);
      let status = 'Active'
      const newCoupon = new Coupon({
        couponCode,
        validity,
        minPurchase,
        minDiscountPercentage,
        discription,
        status
      });
  
      const savedCoupon = await newCoupon.save();
  
      res.status(201).json(savedCoupon);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };
  
  const couponDelete = async (req,res)=>{
    try{
       const {couponId} = req.params;
       console.log(couponId);
    const coupon = await Coupon.findById(couponId)
    console.log(coupon);
    if(!coupon){
      return res.status(404).render('page-not-found');
    }
    coupon.status = 'Cancel'
    await coupon.save()
    res.status(200).json({ message: 'coupon canceled successfully' });
    }catch(error){
      console.log(error.message);
    }
  }

module.exports = {
    adminLoginPost,
    adminLoginGet,
    dashboard,
    AdminLougout,
    unBlock,
    block,
    usersList,
    categories,
    deleteCategory,
    updatCategory,
    editCategory,
    unBlockCategory,
    blockCategory,
    addCategory,
    productList,
    loadCreateingProduct,
    createProduct,
    blockProduct,
    unblockproduct,
    editProduct,
    updateProduct,
    deletProduct,
    orders,
    orderdetails,
    statuschange,
    Salesreport,
    WeeklySales,
    categoryOfferCreate,
    categoryOffer,
    excel,
    checkcategory,
    couponGet,
    couponPost,
    couponDelete
}