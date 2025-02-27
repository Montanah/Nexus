const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const travelerRoutes = require("./routes/travelerRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const bodyParser = require("body-parser");
const passport = require("passport");
const session = require('express-session');

//swagger
const swaggerUI = require("swagger-ui-express"), swaggerDocument = require("./swagger.json");
const setupSwagger = require("./swagger");

require("./controllers/Passport");

const PORT = process.env.PORT || 3001;

const app = express();

require('dotenv').config();
//console.log("JWT_SECRET:", process.env.JWT_SECRET); 

// Database
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/your_database_name';

mongoose.connect(uri)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors({
    origin: "http://localhost:5173", 
    methods: ["GET", "POST", "PUT", "DELETE"], 
  }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false, 
    cookie: { secure: false }, 
  }));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/travelers", travelerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);

app.use("/api/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// Setup Swagger Docs
setupSwagger(app);

app.get("/api", (req, res) => {
    res.json({ message: "Hello from server!" });
  });


app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});