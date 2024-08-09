import mongoose from "mongoose";

const connection = async () => {
  try {
    const DBconnection = await mongoose.connect(process.env.MONGO_URI);
    // console.log("Database connection successful");
    console.log(`MongoDB Connected: ${DBconnection.connection.host}`);
  } catch (err) {
    console.log(err);
  }
};
export default connection;
