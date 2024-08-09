import DataUriParser from "datauri/parser.js";
import path from "path";

const getDataURI = (image) => {
  const parser = new DataUriParser();
  const extName = path.extname(image.originalname).toString();
  return parser.format(extName, image.buffer);
};

export default getDataURI;
