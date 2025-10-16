//  Copyright (c) [2025] [Rasa Consultancy Services]. All rights reserved. 
//  This software is the confidential and proprietary information of [Rasa Consultancy Services]. 
//  You shall not disclose such confidential information and shall use it only in accordance 
//with the terms of the license agreement you entered into with [Rasa Consultancy Services].
//  For more information, please contact: [Your Company Email/Legal Department Contact] 
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

