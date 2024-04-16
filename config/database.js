const mongoose = require("mongoose");

module.exports = async () =>   {
  try {
    const connect = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
    });
    console.log(`MongoDB connected: ${connect.connection.host}`);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};
