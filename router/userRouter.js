import router from 'express'
import {
  acceptRequest,
  getallnotification,
  getUser,
  loginUser,
  registerUser,
  searchUser,
  sendRequest,
  getMyFriends,
} from "../controller/userController.js";
import { singleAvatar } from '../middleware/multer.js'
import { authMiddleware } from '../middleware/authmiddleware.js'
import { loginValidator, registerValidator, validatorHandler } from '../middleware/validator.js'

const user = router()


user.get("/getuser",authMiddleware,getUser)
user.post("/registeruser", singleAvatar, registerValidator(), validatorHandler, registerUser).post("/loginuser", loginValidator(), validatorHandler, loginUser)
user.get("/searchuser", authMiddleware, searchUser)
user.put("/sendRequest", authMiddleware, sendRequest)
user.put("/acceptRequest", authMiddleware, acceptRequest)
user.get("/getallnotification", authMiddleware, getallnotification)

user.get("/getMyFriends", authMiddleware, getMyFriends)


export default user