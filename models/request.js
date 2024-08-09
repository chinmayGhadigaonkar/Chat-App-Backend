import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ["pending", "accepted", "rejected"],
  },
  sender: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    require: true,
  },
  receiver: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    require: true,
  },
});


const Request = mongoose.model("Request", requestSchema);
export default Request