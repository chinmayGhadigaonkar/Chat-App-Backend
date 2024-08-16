import Chat from '../models/chat.js'
import { ErrorHandler } from '../utils/utility.js'
import { CloudinaryFileUpload, emitEvent, transFormImage } from '../utils/features.js'
import { ALERT , NEW_ATTACHEMENT, NEW_MESSAGE, REFETCH_CHAT } from '../constant/event.js'
import User from '../models/user.js'
import Message from '../models/message.js'
import { userSocket } from "../index.js";



const newGroup = async(req ,res , next)=>{ 
    const {name , members} = req.body
    

    if(members.length < 2){
        return next(new ErrorHandler("Members must be more than 1" , 400))
    }

    const allMembers = [...members , req.user]

    const newChat = await Chat.create({
        name,
        groupChat:true,
        creator:req.user,
        members: allMembers
    })

    emitEvent(req,ALERT,allMembers,{message:`${req.user.name} created a new group chat`})
    emitEvent(req,REFETCH_CHAT,members)

    res.status(201).json({
        success:true,
        message:"Group  created",
        data:newChat
    })

}


const getMyChat = async(req ,res , next)=>{
    
    try{
        const chats = await Chat.find({members:req.user._id}).populate('members', 'name avatar')
        if(!chats){
            return next(new ErrorHandler("No chat found", 404))
        }
        const trasnsformChat = chats.map(({_id ,name, members,avatar, groupChat})=>{
            const otherMembers = members.filter(member => member._id.toString() !== req.user._id.toString())
            return {
                _id,
                groupChat,
                name: groupChat ? name : otherMembers[0].name,
                avatar : groupChat ? members.slice(0,3).map(({avatar} )=>avatar[0].url) : otherMembers[0].avatar[0].url,
                members: members.reduce((prev, curr) => {
                    if (curr._id.toString() !== req.user._id.toString()) {
                        prev.push(curr);
                    }
                    return prev;
                }, []),
    
    
            }
    
        })
        res.status(200).json({
            success:true,
            message:"My chats",
            data:trasnsformChat
        })
    }
    catch(err){
        return next(new ErrorHandler("No chat found", 404))
    }
}


const getGroupChat = async (req, res, next) => {
    try {
      const chats = await Chat.find({ groupChat: true, creator: req.user._id, members: req.user._id }).populate('members', "name avatar");
  
      if (chats.length === 0) {
        return next(new ErrorHandler("No group chat found", 404));
      }  
      const groups = chats.map(({ _id, name, members, avatar, groupChat }) => {
        return {
          _id,
          groupChat,
          name,
          avatar: members.slice(0, 3).map((member) => member.avatar[0].url),
          members,
        };
      });
  
      res.status(200).json({
        success: true,
        message: "My group chats",
        groups,
      });
    } catch (error) {
      next(new ErrorHandler(error.message, 500));
    }
  };


 
  const addMember = async (req, res, next) => {
    try {
      const { chatId, members } = req.body;
      if (!members || members.length === 0) {
        return next(new ErrorHandler("Please provide members", 400));
      }
      const chat = await Chat.findById(chatId).populate('members', 'name');

    
      if (!chat) {
        return next(new ErrorHandler("Chat not found", 404));
      }
      if (chat.groupChat === false) {
        return next(new ErrorHandler("This is not a group chat", 400));
      }
      if (chat.creator.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("You are not authorized to add member", 403));
      }
  
      const allNewMembersPromise = members.map((memberId) => User.findById(memberId, "name"));
  
      const allNewMembers = await Promise.all(allNewMembersPromise);
  
      const validMembers = allNewMembers.filter(
        (member) => member && !chat.members.some((chatMember) => chatMember._id.equals(member._id))
      );
  
      chat.members.push(...validMembers.map((member) => member._id));

      // chat.members.push(...validMembers.map(member => member._id));
  
      if (chat.members.length > 50) {
        return next(new ErrorHandler("Members limit exceeded", 400));
      }
  
      await chat.save();
  
      const allUserName = validMembers.map(member => member.name).join(",");
  
      emitEvent(
        req,
        ALERT,
        chat.members,
        { message: `${allUserName} added to this group` }
      );
  
      emitEvent(
        req,
        REFETCH_CHAT,
        chat.members
      );
  
      res.status(200).json({
        success: true,
        message: "Members added successfully",
        chat,
      });
    } catch (error) {
      next(new ErrorHandler(error.message, 500));
    }
  };
    

 const removeMember = async (req, res, next) => {
    try {
      const { chatId, memberId } = req.body;
  
      const chat = await Chat.findById(chatId).populate('members', 'name');

      if (!chat) {
        return next(new ErrorHandler("Chat not found", 404));
      }
      if (chat.groupChat === false) {
        return next(new ErrorHandler("This is not a group chat", 400));
      }
      if (chat.creator.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("You are not authorized to add member", 403));
      }

      if (chat.members.length === 2) {
        return next(new ErrorHandler("Can't remove member from group", 400));
      }
      

      chat.members = chat.members.filter((member) => member._id.toString() !== memberId.toString());

     await chat.save();
     
     emitEvent(req,ALERT,chat.members,{message:`${req.user.name} removed from the group`})
      emitEvent(req,REFETCH_CHAT,chat.members)

      res.status(200).json({success:true, message:"Member removed successfully", chat})  
    }
    catch(err){
        return next(new ErrorHandler("No chat found", 404))
    }
  }

  const leaveGroup = async (req, res, next) => {
    try {
      const { chatId } = req.body;
      const userId  = req.params.id;
  
      const chat = await Chat.findById(chatId).populate('members', 'name');
  
      if (!chat) {
        return next(new ErrorHandler("Chat not found", 404));
      }
 
  
      if (chat.members.length === 2) {
        return next(new ErrorHandler("Can't leave group, only two members left", 400));
      }
  
      chat.members = chat.members.filter((member) => member._id.toString() !== userId.toString());
  
      if (chat.creator.toString() === userId.toString()) {
        const randomNumber = Math.floor(Math.random() * chat.members.length);
        chat.creator = chat.members[randomNumber]._id; // Ensure we assign the _id of the new creator
      }
  
      await chat.save();
  
      emitEvent(req, ALERT, chat.members, { message: `Someone left the group` });
      emitEvent(req, REFETCH_CHAT, chat.members); // Ensure this event is emitted
  
      res.status(200).json({ success: true, message: "You left the group", chat });
    } catch (err) {
      next(new ErrorHandler(err.message, 500));
    }
  };
  

const sendAttachment = async (req, res, next) => {
  try {
    const { chatId } = req.body;

    const [chat, me] = await Promise.all([
      Chat.findById(chatId),
      User.findById(req.user._id, "name"),
    ]);

    if (!chat) {
      return next(new ErrorHandler("No chat found", 404));
    }

    const files = req.files;

    if (!files || files.length === 0) {
      return next(new ErrorHandler("Please provide files", 400));
    }

    const result = await CloudinaryFileUpload(files);

    const attachment = result.map(({ public_id, secure_url }) => ({
      public_id,
      url: transFormImage(secure_url, 150),
    }));

    const messageForRealtime = {
      content: "", // Add content if necessary
      attachment,
      sender: {
        _id: me._id,
        name: me.name,
      },
      chat: chat._id,
    };

    const messageForDB = {
      content: "", // Add content if necessary
      attachment,
      sender: {
        _id: me._id,
        name: me.name,
      },
      chat: chat._id,
    };

    const messages = await Message.create(messageForDB);

    const ForPopulateSender = await Message.findById(messages._id).populate(
      "sender",
      "name avatar"
    );

    // console.log("Chat members:", chat.members);

    // emitEvent(req, "REFETCH_CHAT", chat.members, { chat: chat._id });

    res.status(200).json({
      success: true,
      message: "Attachment sent successfully",
      messages: ForPopulateSender,
    });
  } catch (err) {
    console.error("Error sending attachment:", err);
    return next(new ErrorHandler("Failed to send attachment", 500));
  }
};

const getChatDetail = async (req, res, next) => {
  try {
    if (req.query.populate === "true") {
      const chat = await Chat.findById(req.params.id)
        .populate("members", "name avatar")
        .lean();
      if (!chat) {
        return next(new ErrorHandler("Chat not found", 404));
      }

      chat.members = chat.members.map(({ _id, name, avatar }) => ({
        _id,
        name,
        avatar: avatar[0].url,
      }));

      res.status(200).json({ success: true, message: "Chat found", chat });
    } else {
      const chat = await Chat.findById(req.params.id);
      if (!chat) {
        return next(new ErrorHandler("Chat not found", 404));
      }
      res.status(200).json({ success: true, message: "Chat found", chat });
    }
  } catch (err) {
    return next(new ErrorHandler("No chat found", 404));
  }
};

const renameGroup = async (req, res, next) => {
  try {
    // const {id} = req.params.id;
    const { name } = req.body;
    // console.log(req.params.id);

    const chat = await Chat.findById(req.params.id);
    // console.log(chat);
    if (!chat) {
      return next(new ErrorHandler("Chat not found", 404));
    }
    // console.log(chat.creator , req.user);
    if (chat.creator.toString() !== req.user._id.toString()) {
      return next(
        new ErrorHandler("You are not authorized to rename group", 403)
      );
    }
    if (chat.groupChat === false) {
      return next(new ErrorHandler("This is not a group chat", 400));
    }

    chat.name = name;
    await chat.save();

    emitEvent(req, ALERT, chat.members, {
      message: `Group name changed to ${name}`,
    });
    emitEvent(req, REFETCH_CHAT, chat.members);

    res.status(200).json({
      success: true,
      message: "Group name changed successfully",
      chat,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
};

const deleteChat = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return next(new ErrorHandler("Chat not found", 404));
    }

    const members = chat.members;

    if (chat.groupChat && chat.creator.toString() !== req.user._id.toString()) {
      return next(
        new ErrorHandler("You are not authorized to delete this chat", 403)
      );
    }

    if (
      !chat.groupChat &&
      !chat.members.some(
        (member) => member.toString() === req.user._id.toString()
      )
    ) {
      return next(
        new ErrorHandler("You are not authorized to delete this chat", 403)
      );
    }

    const messagesWithAttachment = await Message.find({
      chat: chat._id,
      attachment: { $ne: [] },
    });

    const publicIds = [];
    messagesWithAttachment.forEach(({ attachment }) => {
      attachment.forEach(({ public_id }) => publicIds.push(public_id));
    });

    const deleteAttachmentsFromCloudinary = async (publicIds) => {
      if (publicIds.length > 0) {
        for (const publicId of publicIds) {
          await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
        }
      }
    };

    await Promise.all([
      deleteAttachmentsFromCloudinary(publicIds),
      chat.deleteOne(),
      Message.deleteMany({ chat: chat._id }),
    ]);

    emitEvent(req, REFETCH_CHAT, members);
    res
      .status(200)
      .json({ success: true, message: "Chat deleted successfully" });
  } catch (err) {
    next(new ErrorHandler(err.message, 500));
  }
};

const getMessages = async (req, res, next) => {
  try {
    const chatId = req.params.id;
    const { page = 1 } = req.query;
    const resultPerPage = 20;
    const skip = (page - 1) * resultPerPage;

    // Fetch messages and total message count
    const [messages, totalMessage] = await Promise.all([
      Message.find({ chat: chatId })
        .sort({ createdAt: 1 }) // Sort by createdAt in descending order
        .skip(skip)
        .limit(resultPerPage)
        .populate("sender", "name avatar")
        .lean(),

      Message.countDocuments({ chat: chatId }),
    ]);

    const totalPages = Math.ceil(totalMessage / resultPerPage) || 0;

    res.status(200).json({
      success: true,
      message: "Messages found",
      messages: messages.reverse(), // No need to reverse the messages now
      totalPages,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
};
  
export {newGroup ,getMyChat, getGroupChat, addMember, removeMember, leaveGroup ,sendAttachment, getChatDetail, renameGroup, deleteChat,getMessages}