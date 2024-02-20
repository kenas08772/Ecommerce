const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const databaseConnection = require('./config/database');
app.use(express.static('public'));

databaseConnection();

app.set('views', [
  path.join(__dirname, 'views'),
  path.join(__dirname, 'views/users'),
  path.join(__dirname, 'views/admin')
]);

app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));

// Routes
const userRouter = require('./routes/userRouter')
const adminRouter = require('./routes/adminRouter')
// const { cartRouter} = require('./routes/cartRouter')
const {cartRouter} = require('./routes/cart')

app.use('/', userRouter);
app.use('/admin', adminRouter)
app.use('/cart',cartRouter)

app.use('*',(req,res) => {
  res.render('404page')
})
const PORT = process.env.PORT || 6000;

app.listen(PORT, () => {
  console.log(`Server is running http://localhost:${PORT}`)
});

module.exports = app;
