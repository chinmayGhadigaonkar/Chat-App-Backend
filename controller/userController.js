import User from "../models/user.js";
import { compare } from "bcrypt";
import getToken from "../utils/getToken.js";
import { ErrorHandler } from "../utils/utility.js";
import Chat from "../models/chat.js";
import Request from "../models/request.js";
import { emitEvent } from "../utils/features.js";
import user from "../router/userRouter.js";
import { v2 as cloudinary } from "cloudinary";
import getDataURI from "../utils/getDataUrl.js";

export const getUser = async (req, res) => {
  try {
    // // console.log(req.user);
    const user = await User.findById(req.user._id).select("-password");
    res.status(201).json({ success: true, user });
  } catch (e) {
    res.status(404).json({ success: true, error: e });
  }
};

export const registerUser = async (req, res) => {
  try {
    let { name, userName, password } = req.body;

    const file = req.file;

    const fileUrl = getDataURI(file);

    // // console.log(fileUrl);
    const cloud = await cloudinary.uploader.upload(fileUrl.content);
    // // console.log(cloud);
    const avatar = [{ url: cloud.secure_url, public_id: cloud.public_id }];

    // Check if all required fields are provided
    if (!name || !userName || !password || !avatar) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ userName });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "Username already exists" });
    }

    // Create a new user
    const user = await User.create({ name, userName, password, avatar });

    return res
      .status(201)
      .json({ success: true, user, message: "Registered successfully" });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};

export const loginUser = async (req, res, next) => {
  try {
    let { userName, password } = req.body;

    const findUser = await User.findOne({ userName });
    if (!findUser) {
      // res.status(400).send({success: false , message:"Plz enter valid usename or password"})
      return next(
        new ErrorHandler("Plz enter valid usename or password ", 400)
      );
    }
    const comparePassword = await compare(password, findUser.password);
    if (!comparePassword) {
      // res.status(400).json({ success:false, msg: "please try to login with valid credential" });
      return next(new ErrorHandler("Plz enter valid usename or password", 400));
    }

    getToken(res, 201, findUser);
  } catch (err) {
    next(new Error(err));
  }
};

export const searchUser = async (req, res, next) => {
  try {
    const { name } = req.query;

    // Find all my chats
    const myChats = await Chat.find({ groupChat: false, members: req.user });
    // // console.log(myChats);
    // extract all the user ids from my chats
    const allUserFromMyChats = myChats.flatMap((chat) => chat.members);
    //   // console.log(allUserFromMyChats);
    // // console.log(allUserFromMyChats);
    const allUserExceptMeAndFriend = await User.find({
      _id: { $nin: allUserFromMyChats },
      name: { $regex: name, $options: "i" },
    });
    // console.log(allUserExceptMeAndFriend);
    const users = allUserExceptMeAndFriend.map(({ _id, name, avatar }) => ({
      _id,
      name,
      avatar: avatar[0].url,
    }));

    res.status(200).json({ success: true, users });
  } catch (err) {
    next(new Error(err));
  }
};

export const sendRequest = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const request = await Request.findOne({
      $or: [
        { sender: req.user, receiver: userId },
        { sender: userId, receiver: req.user },
      ],
    });
    if (request) {
      return next(new ErrorHandler("Request already sent", 400));
    }

    emitEvent(req, "NEW_REQUEST", [userId]);

    await Request.create({
      sender: req.user,
      receiver: userId,
      status: "pending",
    });
    res.status(201).json({ success: true, message: "Request sent" });
  } catch (err) {
    next(new Error(err));
  }
};

export const acceptRequest = async (req, res, next) => {
  try {
    const { requestId, accept } = req.body;
    // console.log(requestId, accept);

    const request = await Request.findById(requestId)
      .populate("sender", "name")
      .populate("receiver", "name");
    // console.log(request);
    if (!request) {
      return next(new ErrorHandler("Request not found", 404));
    }

    if (request.receiver._id.toString() !== req.user._id.toString()) {
      return next(
        new ErrorHandler("You are not authorized to accept this request", 403)
      );
    }

    if (!accept) {
      await request.remove();
      return res
        .status(200)
        .json({ success: true, message: "Request declined" });
    }

    const members = [request.sender._id, request.receiver._id];

    await Promise.all([
      Chat.create({
        members,
        name: `${request.sender.name} and ${request.receiver.name}`,
      }),
      request.deleteOne(),
    ]);

    emitEvent(req, "REFECH_CHAT", members);
    res.status(200).json({
      success: true,
      message: "Request accepted",
      senderId: request.sender._id,
    });
  } catch (err) {
    next(new Error(err));
  }
};

export const getallnotification = async (req, res, next) => {
  try {
    // console.log(req.user._id);
    const request = await Request.find({ receiver: req.user._id }).populate(
      "sender",
      "name avatar"
    );
    // // console.log(request);

    const allRequest = request.map(({ _id, sender }) => ({
      _id,
      sender: {
        _id: sender._id,
        name: sender.name,
        avatar: sender.avatar[0].url,
      },
    }));

    res.status(200).json({
      success: true,
      allRequest,
    });
  } catch (err) {
    next(err);
  }
};

export const getMyFriends = async (req, res, next) => {
  try {
    const chatId = req.query.chatId;

    const chat = await Chat.find({
      members: req.user,
      groupChat: false,
    }).populate("members", "name avatar");

    const friends = chat.map(({ members }) => {
      const friend = members.find(
        (member) => member._id.toString() !== req.user._id.toString()
      );
      return {
        _id: friend._id,
        name: friend.name,
        avatar: friend.avatar[0].url,
      };
    });
    if (chatId) {
      const chat = await Chat.findById(chatId).populate(
        "members",
        "name avatar"
      );
      // console.log(chat.members);
      const availableFriends = chat.members.filter(
        (friend) => !chat.members.includes(friend._id)
      );

      return res.status(200).json({ success: true, friends: availableFriends });
    }

    res.status(200).json({ success: true, friends });
  } catch (err) {
    next(err);
  }
};
