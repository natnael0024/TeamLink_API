import express from 'express'
import messageController from '../controllers/MessageController.js'
import { authenticateToken } from '../middlewares/authmiddleware.js'
const router = express.Router()

router.get('/:channelId/messages', authenticateToken, messageController.getMessages)
router.post('/:channelId/messages/create',authenticateToken, messageController.create)

export default router