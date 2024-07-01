import express from 'express'
import workspaceController from '../controllers/WorkSpaceController.js'
import { authenticateToken } from '../middlewares/authmiddleware.js'
const router = express.Router()

router.post('/create',authenticateToken, workspaceController.create)
router.get('/',authenticateToken, workspaceController.getWorkSpaces)
router.get('/:id',authenticateToken, workspaceController.getWorkSpace)
router.get('/:id/channels/:channelId',authenticateToken, workspaceController.getChannel)
router.post('/:id/update',authenticateToken, workspaceController.updateWorkSpace)
router.delete('/:id/delete',authenticateToken, workspaceController.deleteWorkSpace)

router.post('/:id/invite',authenticateToken, workspaceController.sendWorkspaceInvitation)


export default router