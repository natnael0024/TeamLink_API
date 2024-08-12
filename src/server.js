import express from 'express';
import 'dotenv/config';
import authRoutes from './routes/authRoutes.js'
import wsRoutes from './routes/wsRoutes.js'
import channelRoutes from './routes/channelRoutes.js'
import messageRoutes from './routes/messageRoutes.js'
import cors from 'cors'
import {Server} from 'socket.io'
import http from 'http'
import {prisma} from './db/index.js'

const app = express();
const port = process.env.PORT || 3000;

const server = http.createServer(app)
const io = new Server(server,{
  cors:{
    // origin:"http://localhost:5173"
    origin:"https://teamlink.onrender.com/"
  }
})

// io.on("connection",(socket)=>{
//   console.log("User connected : ",socket.id)

//   socket.on("send_message",(data)=>{
//     console.log('data: ', data)
//     socket.broadcast.emit("receive_message",data)
//   })
//   // Handle join event
//   socket.on('join', (channelId, userId) => {
//     socket.join(channelId);
//     console.log(`User ${userId} joined channel ${channelId}`);
//   });

//   // Handle leave event
//   socket.on('leave', (channelId, userId) => {
//     socket.leave(channelId);
//     console.log(`User ${userId} left channel ${channelId}`);
//   });

//   // Handle message event
//   socket.on('message', async (channelId, userId, message) => {
//     try {
//       const newMessage = await prisma.message.create({
//         data: {
//           sender_id: userId,
//           channel_id: channelId,
//           content: message,
//         },
//       });
//       io.to(channelId).emit('message', newMessage);
//     } catch (error) {
//       console.error('Error creating message:', error);
//     }
//   });

//   // Handle disconnect event
//   socket.on('disconnect', () => {
//     console.log('user disconnected');
//   });
// })

// io2

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Listen for messages from the client
  socket.on('sendMessage', async ({ channelId, senderId, content }) => {
      try {
        console.log(content)
          // Save the message to the database
          const message = await prisma.message.create({
              data: {
                  sender_id: senderId,
                  channel_id: channelId,
                  text: content.content, 
              },
          });

          // Emit the message to the channel
          // io.to(channelId).emit('messageResponse', message);
          io.to(channelId).emit('messageResponse', {
            ...message,
            sender: {
                id: senderId,
                // You can fetch additional sender details if needed
                // For example, fetching from the User model
                ...(await prisma.user.findUnique({
                    where: { id: senderId },
                    select: { first_name: true, last_name: true, username: true, avatar: true },
                })),
            },
          });
      } catch (error) {
          console.error('Error saving message:', error);
      }
  });

  // Join a channel
  socket.on('joinChannel', (channelId) => {
      socket.join(channelId);
      console.log(`User ${socket.id} joined channel ${channelId}`);
  });

  socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


app.use(cors({
  origin: '*',
  // optionsSuccessStatus: 200
}));

app.use(express.json())
// // app.use(cookiParser())


// app.get('/', (req, res) => {
//   res.send('Hello, World!');
// });


app.use('/api/auth', authRoutes)
app.use('/api/workspaces', wsRoutes)
app.use('/api/channels', channelRoutes)
// app.use('/api/channels', messageRoutes)






