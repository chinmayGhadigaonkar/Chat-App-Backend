import getDataURI, { getBase64WithInfo } from "./getDataUrl.js";
import { v2 as cloudinary } from "cloudinary";
import { userSocket } from "../index.js";
import user from "../router/userRouter.js";
import { v4 as uuid } from "uuid";
import { NEW_MESSAGE } from "../constant/event.js";

const emitEvent = (req, event, { chatId, users }, message = "REFECH_DATA") => {
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
  const results = await Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ resource_type: "auto" }, (err, result) => {
              if (err) {
                resolve({
                  public_id: uuid(),
                  secure_url: "not uploaded successfully",
                });
              } else {
                resolve(result);
              }
            })
            .end(file.buffer);
        })
    )
  );
  return results;
};

const transFormImage = (url = "", width = 300) => {
  const newUrl = url.replace("upload", `upload/w_${width}`);
  return newUrl;
};



export { emitEvent, transFormImage, CloudinaryFileUpload };
