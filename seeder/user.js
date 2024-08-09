import { faker, simpleFaker } from '@faker-js/faker';
import User from '../models/user.js';
import Chat from '../models/chat.js';
import Message from '../models/message.js';

const createUser = async (numberUser) => {
    const usersPromise = []

    for (let i = 0; i < numberUser; i++) {
    const tempUser = User.create({
        name: faker.person.fullName(),
        userName : faker.internet.userName(),
        bio: faker.lorem.sentence(),
        password: "123456789",
        avatar: {
            url: faker.image.avatar(),
            public_id: faker.system.fileName()
        }
    })
    usersPromise.push(tempUser)
    }

    await Promise.all(usersPromise)
    console.log('User created')
    process.exit(1)
    
}


const createSingleChats = async (numsChat) => {
  try {
    const users = await User.find().select('_id');
    const chatPromises = [];

    for (let i = 0; i < numsChat; i++) {
      for (let j = 0; j < users.length; j++) {
        if (i !== j) { // Ensure a user doesn't chat with themselves
          chatPromises.push(Chat.create({
            name: faker.lorem.words(1),
            members: [users[i]._id, users[j]._id],
          }));
        }
      }
    }

    await Promise.all(chatPromises);
    console.log('Chats created');
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};


const createGroupChats = async (numsChat) => {
    try {
      const users = await User.find().select('_id');
  
      const chatPromises = [];
      for (let i = 0; i < numsChat; i++) {
        const numMembers = faker.number.int({ min: 3, max: users.length });
        const members = new Set();
  
        while (members.size < numMembers) {
          const randomIndex = faker.number.int({ min: 0, max: users.length - 1 });
          members.add(users[randomIndex]._id);
        }
  
        const membersArray = Array.from(members);
        chatPromises.push(
          Chat.create({
            name: faker.lorem.words(1),
            groupChat: true,
            members: membersArray,
            creator: membersArray[0],
          })
        );
      }
  
      await Promise.all(chatPromises);
      console.log('Group chats created');
      process.exit(0);
    } catch (err) {
      console.log(err);
      process.exit(1);
    }
  };
  

const createMeassage = async( numsMessage) => {
    try{

        const user = await User.find().select('_id')
        const chat = await Chat.find().select('_id')

        const messagePromise = []

        for (let i = 0; i < numsMessage; i++) {
            const randomUserIndex = user[Math.floor(Math.random() * user.length)]
            const randomChatIndex = chat[Math.floor(Math.random() * chat.length)]
           
            messagePromise.push(
                Message.create({
                    sender: randomUserIndex,
                    chat: randomChatIndex,
                    content: faker.lorem.sentence(5)
                })
            )
        }

        await Promise.all(messagePromise)
        console.log('Message created')
        process.exit(0);
    }

    catch(err){
        console.log(err)
    }

}
const createMessageInChat = async (chatId, numsMessage) => {
    try {
      const users = await User.find().select('_id');
      const chat = await Chat.findById(chatId).select('_id');
  
      if (!chat) {
        console.log('Chat not found');
        process.exit(1);
      }
  
      const messagePromises = [];
  
      for (let i = 0; i < numsMessage; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)]._id;
  
        messagePromises.push(
          Message.create({
            sender: randomUser,
            chat: chat,
            content: faker.lorem.words(5),
          })
        );
      }
  
      await Promise.all(messagePromises);
      console.log('Messages created');
      process.exit(0);
    } catch (err) {
      console.log(err);
      process.exit(1);
    }
  };
  


export { createUser , createSingleChats, createGroupChats , createMeassage, createMessageInChat};