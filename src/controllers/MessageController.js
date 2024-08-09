import {prisma} from '../db/index.js'
import async from 'express-async-handler'

// Get messages for a channel

const messageController = {
getMessages: async (async(req, res) => {
  const { channelId } = req.params;
  try {
    const messages = await prisma.message.findMany({
      where: { channel_id: parseInt(channelId) },
      include: { sender: true },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching messages' });
  }
}),

// Create a new message
create: async(async (req, res) => {
  const { channelId } = req.params;
  const { senderId, content } = req.body;
  try {
    const newMessage = await prisma.message.create({
      data: {
        sender_id: senderId,
        channel_id: parseInt(channelId),
        content,
      },
    });
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: 'Error creating message' });
  }
})
}

export default messageController