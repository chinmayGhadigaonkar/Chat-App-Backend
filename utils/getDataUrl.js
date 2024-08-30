import DataUriParser from "datauri/parser.js";
import path from "path";

const getDataURI = (image) => {
  const parser = new DataUriParser();
  const extName = path.extname(image.originalname).toString();
  return parser.format(extName, image.buffer);
};

export const getBase64WithInfo = (file) => {
  const base64String = `data:${file.mimetype};base64,${file.buffer.toString(
    "base64"
  )}`;
  console.log(file.mimetype);
  return base64String;
};



export default getDataURI;
