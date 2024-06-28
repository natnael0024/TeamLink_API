import {prisma} from '../db/index.js'
import async from 'express-async-handler'

const workspaceController = {
    create: async(async(req,res)=>{
        const wsId = parseInt(req.params.wsId)
        let { name, avatar, cover} = req.body
        if(!name || wsId){
            return res.status(400).json({message:'channel name & workspace id are required'})
        }

        try{
            let newChannel = await prisma.channel.create({
                data:{
                    workspace_id:parseInt(wsId),
                    name:name,
                    avatar:avatar,
                    cover:cover
                }
            })
            // add creator to channel
            let chm = await prisma.channelMember.create({
               data:{
                    channel_id: newChannel.id,
                    user_id: parseInt(req.user.userId),
               }
            })
            return res.status(201).json(newChannel)
        }catch(e){
            throw e
        }
    }),

    getChannels: async(async(req,res)=>{
        const wsId = parseInt(req.params.wsId)
        let channels = await prisma.channel.findMany({
            where:{
                workspace_id: wsId
            },
            include: {
                members: true, // Include associated channels
            },
        })
        return res.status(200).json(channels)
    }),

    getChannel: async(async(req,res)=>{
        const wsId = parseInt(req.params.wsId)
        const channelId = parseInt(req.params.channelId)
        let ws = await prisma.channel.findUnique({
            where:{
                id:channelId,
                members:{
                    some:{
                        user_id: parseInt(req.user.userId)
                    }
                }
            },
            include: {
                members: true, 
            },
        })
        if(!ws)
            return res.status(404).json({message:'channel not found'})   
        return res.status(200).json(ws)
    }),

    updateChannel: async(async(req,res)=>{
        const channelId = parseInt(req.params.channelId)
        let { name, avatar, cover} = req.body
        try{
            let updatedChannel = await prisma.channel.update({
                where:{
                    id:channelId,
                    Workspace: { 
                        ownerId: parseInt(req.user.userId)
                    },
                },
                data:{
                    name,
                    avatar,
                    cover
                }
            })
            if(!updatedChannel)
                return res.status(404).json({message:'channel not found'})   
            return res.status(200).json(updatedWs)
        } catch(e){
            throw e
        }
    }),

    deleteChannel: async(async(req,res)=>{
        const channelId = parseInt(req.params.channel)
        let channel = await prisma.channel.delete({
            where:{
                id:wsId,
                Workspace: { 
                    ownerId: parseInt(req.user.userId)
                },
            }
        })
        if(!channel)
            return res.status(404).json({message:'channel not found'}) 
        return res.status(204).json({message:'channel deleted successfully'})   
    })
}


export default  workspaceController