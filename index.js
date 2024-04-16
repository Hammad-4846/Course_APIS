const express = require("express");
const app = express();
const dotenv = require("dotenv");

//Configuration 
dotenv.config({ path: "./config/config.env" });

//Database Connection
const dbConnect = require("./config/database");

//Middlewares
const morgan = require("morgan");
const cors = require("cors");
const cookie = require("cookie-parser");

//Cloudinary(For Uploading Images)
const cloudinary = require("cloudinary").v2;

//Routers
const user = require("./routes/userRoute");
const course = require("./routes/courseRoute");



const PORT = process.env.PORT || 4001;

//Configuration Cloud Platform
cloudinary.config({
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  cloud_name: process.env.CLOUD_NAME,
});

const origin = process.env.ORIGIN;
app.use(cookie());

app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: "20mb" }));
app.use(morgan("common"));
app.use(
  cors({
    credentials: true,
    origin,
  })
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.use("/api/v1", user);
app.use("/api/v1", course);


dbConnect();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
