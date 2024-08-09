
import router from 'express'
import { authMiddleware } from '../middleware/authmiddleware.js'
import { addMember, getGroupChat, getMyChat, newGroup, removeMember ,leaveGroup ,sendAttachment, getChatDetail, renameGroup, deleteChat, getMessages} from '../controller/chatController.js'
import { sendAttachmentMulter } from '../middleware/multer.js'
const chats = router()
 

chats.post("/newGroup", authMiddleware,newGroup)
chats.get("/getMyChats", authMiddleware,getMyChat).get("/getMyGroupChats", authMiddleware,getGroupChat)

chats.put("/addMember" , authMiddleware,addMember)
chats.delete("/removeMember", authMiddleware,removeMember).delete("/leaveGroup/:id", leaveGroup)

// send attachment
 chats.post("/sendAttachment", sendAttachmentMulter,authMiddleware, sendAttachment )

// get chat detail
chats.get("/getChatMessage/:id", getMessages)
//  chat
chats.route("/:id").get(getChatDetail).put(authMiddleware,renameGroup).delete(authMiddleware,deleteChat)

export default chats