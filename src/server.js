import express from 'express';
import 'dotenv/config';
import authRoutes from './routes/authRoutes.js'
import wsRoutes from './routes/wsRoutes.js'
import channelRoutes from './routes/channelRoutes.js'
import cors from 'cors'
const app = express();
const port = process.env.PORT || 3000;



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.use(cors({
  origin: '*',
  // optionsSuccessStatus: 200
}));

app.use(express.json())
// app.use(cookiParser())


app.get('/', (req, res) => {
  res.send('Hello, World!');
});


app.use('/api/auth', authRoutes)
app.use('/api/workspaces', wsRoutes)
app.use('/api/channels', channelRoutes)





