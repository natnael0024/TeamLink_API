import {prisma} from '../db/index.js'
import async from 'express-async-handler'

const channelController = {
    create: async(async(req,res)=>{
        const wsId = parseInt(req.params.wsId)
        let { name, avatar, cover} = req.body
        if(!name){
            return res.status(400).json({message:'channel name is required'})
        }

        try{
            // check if ws exist and belong to the user
            let ws = await prisma.workspace.findUnique({
                where:{
                    id: wsId,
                    ownerId:parseInt(req.user.userId)
                }
            })
            if(!ws)
                return res.status(404).json({message:'workspace not found'})
            // create channel
            let newChannel = await prisma.channel.create({
                data:{
                    workspace_id:wsId,
                    name:name,
                    avatar:avatar,
                    cover:cover
                }
            })
            // add creator to channel as member
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
                workspace_id: wsId,
                OR: [
                        {
                          members: {
                            some: { user_id: parseInt(req.user.userId) }, // User is a member of the channel
                          },
                        },
                        {
                          Workspace: { ownerId: parseInt(req.user.userId) }, // User is the workspace owner
                        },
                  ],
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
        const channelId = parseInt(req.params.id)
        let channel = await prisma.channel.delete({
            where:{
                id:channelId,
                Workspace: { 
                    ownerId: parseInt(req.user.userId)
                },
            }
        })
        if(!channel)
            return res.status(404).json({message:'channel not found'}) 
        return res.status(204).json({message:'channel deleted successfully'})   
    }),

    addMember: async(async(req,res)=>{
        const wsId = parseInt(req.params.wsId)
        const channelId = parseInt(req.params.channelId)
        const { userId } = req.body
        let wsAndChannel = await prisma.workspace.findUnique({
            where: {
                id: wsId,
                ownerId: req.user.userId
            },
            include: {
                channels: {
                    where: {
                        id: channelId
                    }
                }
            }
        });
        
        if (!wsAndChannel || wsAndChannel.channels.length === 0) {
            return res.status(404).json({ message: 'workspace or channel not found' });
        }
        
        // let channel = wsAndChannel.channels[0];

        let channelMember = await prisma.channelMember.create({
            data:{
                channel_id: channelId,
                user_id:userId
            }
        })
        return res.status(201).json({message:'success'})
    })
}


export default  channelController