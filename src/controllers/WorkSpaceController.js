import {prisma} from '../db/index.js'
import async from 'express-async-handler'

const workspaceController = {
    create: async(async(req,res)=>{
        let {name, description, is_private, logo, cover} = req.body
        if(!name){
            return res.status(400).json({message:'workspace name is required'})
        }

        try{
            let newWorkspace = await prisma.workspace.create({
                data:{
                    ownerId:req.user.userId,
                    name:name,
                    description:description,
                    is_private:is_private,
                    logo:logo,
                    cover:cover
                }
            })
            // add creator to workspacemember
            let wsm = await prisma.workspaceMember.create({
               data:{
                    workspace_id: newWorkspace.id,
                    user_id: parseInt(req.user.userId),
                    is_owner: true
               } 
            })
            return res.status(201).json(newWorkspace)
        }catch(e){
            throw e
        }
    }),

    getWorkSpaces: async(async(req,res)=>{
        const wsId = parseInt(req.params.id)
        let wspcs = await prisma.workspace.findMany({
            where:{
                ownerId:  parseInt(req.user.userId)
            },
            include: {
                // owner: true, 
                channels: true, // Include associated channels
                // members: true, 
            },
        })
        return res.status(200).json(wspcs)
    })
}


export default  workspaceController