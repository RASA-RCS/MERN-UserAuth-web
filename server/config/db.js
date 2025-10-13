import mongoose from "mongoose";

const connectDB = async () => {
  const res = await mongoose.connect(
    "mongodb://localhost:27017/UserDatabse"
  );
  if (res) {
    console.log("connected Successfully");
  }
};

export default connectDB;

