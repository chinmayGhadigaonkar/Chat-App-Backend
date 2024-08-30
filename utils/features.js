import getDataURI, { getBase64WithInfo } from "./getDataUrl.js";
import cloudinary from "cloudinary";
import { userSocket } from "../index.js";
import user from "../router/userRouter.js";
import { v4 as uuid } from "uuid";
import { NEW_MESSAGE } from "../constant/event.js";


const emitEvent = (req, event, { chatId, users }, message) => {
  const io = req.app.get("io");

  const memberSockets = users
    ?.map((member) => {
      const socketId = userSocket.get(member.toString());
      return socketId;
    })
    .filter((socket) => socket);
  io.to(memberSockets).emit(event, { chatId: chatId, message: message });
};

// emitEvent(req, NEW_MESSAGE, chat.members, {
//   message: messageForRealtime,
//   chat: chat._id,
// });

const CloudinaryFileUpload = async (files = []) => {
  const uploadPromises = files.map(async (file) => {
    try {
      const result = await cloudinary.uploader.upload(getBase64WithInfo(file), {
        resource_type: "auto",
        public_id: uuid(),
      });

      console.log(result);
      return result;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw new Error(error.message || "Error uploading file");
    }
  });

  return Promise.all(uploadPromises);
};

const transFormImage = (url = "", width = 300) => {
  const newUrl = url.replace("upload", `upload/w_${width}`);
  return newUrl;
};



export { emitEvent, transFormImage, CloudinaryFileUpload };
