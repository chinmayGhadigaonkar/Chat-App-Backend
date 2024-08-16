import getDataURI, { getBase64WithInfo } from "./getDataUrl.js";
import cloudinary from "cloudinary";
import { userSocket } from "../index.js";
import user from "../router/userRouter.js";
import { v4 as uuid } from "uuid";
import { NEW_MESSAGE } from "../constant/event.js";

const emitEvent = (req, event, users, data) => {
  const io = req.app.get("io");

  // Get all active sockets for the users
  const userSockets = users
    .map((member) => userSocket.get(member.toString()))
    .filter((socket) => socket); // Filter out undefined sockets

  // Emit the event to the collected sockets);
  console.log("Emitting event:", userSocket);

  io.to(userSockets).emit(NEW_MESSAGE, {
    chatId: data.chat,
    members: users,
    attachment: data.message.attachment,
  });
  // chatId, realTimeData;
  // chatId, members, message
};

// emitEvent(req, NEW_MESSAGE, chat.members, {
//   message: messageForRealtime,
//   chat: chat._id,
// });

const getMimeType = (extension) => {
  switch (extension) {
    case ".jpeg":
    case ".jpg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".mp4":
      return "video/mp4";
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".webm":
      return "video/webm";
    case ".pdf":
      return "application/pdf";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".xls":
      return "application/vnd.ms-excel";
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case ".ppt":
      return "application/vnd.ms-powerpoint";
    case ".pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case ".txt":
      return "text/plain";
    case ".csv":
      return "text/csv";

    default:
      throw new Error("Unsupported file type");
  }
};

const CloudinaryFileUpload = async (files = []) => {
  const uploadPromises = files.map(async (file) => {
    try {
      const uploadParams = {
        resource_type: "auto",
        public_id: uuid(),
      };
      const result = await cloudinary.uploader.upload(
        getBase64WithInfo(file),
        uploadParams
      );

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
