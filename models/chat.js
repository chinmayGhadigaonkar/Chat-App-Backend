import mongoose, { Types } from "mongoose";


const chatSchema = new mongoose.Schema({

name:{
    type : String,
    require:true
},
groupChat:{
    type:Boolean,
    default:false
},
creator:{
    type:Types.ObjectId,
    ref:"User"
},
members:[
    {
        type:Types.ObjectId,
        ref:"User"
    }
]

},{
    timestamps:true
})

const Chat = new mongoose.model("Chat" ,chatSchema)

export default Chat