import express from 'express'
import workspaceController from '../controllers/WorkSpaceController.js'
import { authenticateToken } from '../middlewares/authmiddleware.js'
const router = express.Router()

router.post('/create',authenticateToken, workspaceController.create)
router.post('/',authenticateToken, workspaceController.getWorkSpaces)

export default router