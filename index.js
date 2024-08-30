import express from "express";
import connection from "./utils/connection.js";
import dotenv from "dotenv";
import user from "./router/userRouter.js";
import chats from "./router/chatRoute.js";
import { errorMiddleware } from "./middleware/errormiddleware.js";
import { Server } from "socket.io";
import { createServer } from "http";
import {
  createGroupChats,
  createSingleChats,
  createMeassage,
  createMessageInChat,
} from "./seeder/user.js";
import { v2 as cloudinary } from "cloudinary";
import { v4 as uuidv4 } from "uuid";
import {
  ALERT,
  NEW_ATTACHEMENT,
  NEW_MESSAGE,
  START_TYPING,
  STOP_TYPING,
} from "./constant/event.js";
import cors from "cors";
import { SocketAuthMiddleware } from "./middleware/authmiddleware.js";
import Message from "./models/message.js";

const app = express();
export const userSocket = new Map();
dotenv.config();
const PORT = process.env.PORT || 3000;
// Database connection
app.use(express.json());
connection();

const corsOptions = {
  origin: ["http://localhost:5173", "*"],
  credentials: true, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// console.log(process.env.CLOUDINARY_API_SECRET);

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
io.use(async (socket, next) => {
  await SocketAuthMiddleware(socket, next);
});

app.set("io", io);
// Home route

app.get("/", (req, res) => {
  res.send("Hello World");
});

io.on("connection", (socket) => {
  // console.log("Connected to socket: " + socket.id);

  const user = socket.user;
  if (!user) {
    console.log("User not found");
    return;
  }

  // console.log("User connected: " + user._id);
  userSocket.set(user._id.toString(), socket.id);

  socket.on(
    NEW_MESSAGE,
    async ({ chatId, members, message, attachment = [] }) => {
      console.log("Chat ID:", chatId);

      const realTimeData = {
        content: message,
        _id: uuidv4(),
        sender: {
          _id: user._id,
          name: user.name,
        },
        attachment: [],
        chatId: chatId,
        createdAt: new Date().toISOString(),
      };

      const messageForDB = {
        content: message,
        sender: {
          _id: user._id,
          name: user.name,
        },
        chat: chatId,
        attachment: attachment,
      };

      console.log("Members:", members);

      const memberSockets = members?.map((member) => {
        // console.log("Member:", member);
        const socketId = userSocket.get(member.toString());
        // console.log("Socket ID for member:", socketId);
        return socketId;
      });
      // Filter out undefined values

      // console.log(memberSockets);

      io.to(memberSockets).emit(NEW_MESSAGE, { chatId, realTimeData });
      io.to(memberSockets).emit(ALERT, { chatId });

      try {
        const result = await Message.create(messageForDB);
        console.log("Message saved to DB:", result);
      } catch (error) {
        console.error("Error in saving message:", error);
      }
    }
  );

  socket.on(NEW_ATTACHEMENT, async ({ chatId, members, attachment }) => {
    const realTimeData = {
      _id: uuidv4(),
      sender: {
        _id: user._id,
        name: user.name,
      },
      attachment: attachment,
      chatId: chatId,
      createdAt: new Date().toISOString(),
    };

    const memberSockets = members
      ?.map((member) => {
        const socketId = userSocket.get(member.toString());
        return socketId;
      })
      .filter((socket) => socket); // Filter out undefined values

    // console.log("realTimeData from attachment", realTimeData);

    io.to(memberSockets).emit(NEW_ATTACHEMENT, { chatId, realTimeData });
    io.to(memberSockets).emit(ALERT, { chatId });
  });

  socket.on(START_TYPING, ({ chatId, members }) => {
    const memberSockets = members?.map((member) => {
      const socketId = userSocket.get(member.toString());
      return socketId;
    });

    console.log("Typing" + user.userName);

    io.to(memberSockets).emit(START_TYPING, { chatId, user });
  });

  socket.on(STOP_TYPING, ({ chatId, members }) => {
    const memberSockets = members
      ?.map((member) => {
        const socketId = userSocket.get(member.toString());
        return socketId;
      })
      .filter((socket) => socket); // Filter out undefined values
    console.log("Stop Typing" + user.userName);

    io.to(memberSockets).emit(STOP_TYPING, { chatId, user });
  });

  socket.on("disconnect", () => {
    console.log("Disconnected: " + socket.id);
    userSocket.delete(user._id.toString());
  });
});

// createSingleChats(5)
// createGroupChats(5)
// createMeassage(10)
// createMessageInChat("669b5541938df000b3810f9d", 20);

// Routes
app.use("/api/user", user);
app.use("/api/chats", chats);

// middleware
app.use(errorMiddleware);

server.listen(PORT, () => {
  console.log("Server is running on port 3000");
  console.log(`http://localhost:${PORT}`);
});
