import express from 'express'
import channelController from '../controllers/ChannelController.js'
import { authenticateToken } from '../middlewares/authmiddleware.js'
const router = express.Router()

router.post('/:wsId/create',authenticateToken, channelController.create)
router.get('/:wsId',authenticateToken, channelController.getChannels)
router.get('/:id',authenticateToken, channelController.getChannel)
router.post('/:id/update',authenticateToken, channelController.updateChannel)
router.delete('/:id/delete',authenticateToken, channelController.deleteChannel)

router.post('/:wsId/channels/:channelId/addmember',authenticateToken, channelController.addMember)

export default router