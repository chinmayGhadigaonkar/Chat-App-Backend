import jwt from "jsonwebtoken";
import User from "../models/user.js";

const authMiddleware = async (req, res, next) => {
  const token = req.header("authtoken");
  if (!token) {
    res.status(401).send({ error: "Please authenticate using a valid token" });
    return;
  }
  try {
    const decodeData = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decodeData.id).select("-password");
    next();
  } catch (error) {
    res.status(401).send({ error: "Something is Wrong " });
  }
};



const SocketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Please authenticate using a valid token"));
    }
    const decodeData = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodeData.id).select("-password");
    if (!user) {
      return next(new Error("No user found"));
    }
    socket.user = user;
    next();
  }

  catch (error) {
    return next(new Error("Something is Wrong"));
  }
}

export {authMiddleware, SocketAuthMiddleware};