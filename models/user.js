import mongoose from "mongoose";
import { hash,genSalt } from "bcrypt";
import jwt from "jsonwebtoken"
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
      unique:true
    },
    bio: {
      type: String,
      
    },
    password: {
      type: String,
      required: true,
    },
    avatar: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);


userSchema.pre("save", async function(){
  let salt = await genSalt(10);
  this.password = await hash(this.password, salt) 
})

userSchema.methods.getJWTToken = function(){
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
  })

}

const User = mongoose.model("User", userSchema);
export default User;
