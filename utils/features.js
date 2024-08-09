import  getDataURI  from "./getDataUrl.js";
import cloudinary from 'cloudinary';
import { userSocket } from '../index.js';



const emitEvent = (req, event, users, data) => {
  const io = req.app.get("io");

  const userSockets = users.map((member) =>  userSocket.get(member.toString()))
        
    console.log(data);
    

    io.to(userSockets).emit(event, data);
};





const CloudinaryFileUpload = async(files) => {
    const data = [];

    for (let i = 0; i < files.length; i++) {
        const filepath = getDataURI(files[i]);
        data.push(filepath.content)
    }
    const promises = data.map((file) => {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload(file, (result) => {
                resolve(result);
            });
        });
    });

    const results = await Promise.all(promises);

    


    return results;


}

const transFormImage = (url="" ,width=100) => {
    const newUrl = url.replace("upload", `upload/dpr_auto/w_${width}`);
    return newUrl;
}


export {emitEvent , transFormImage, CloudinaryFileUpload}