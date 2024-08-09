import {prisma} from '../db/index.js'
import async from 'express-async-handler'

const channelController = {
    create: async(async(req,res)=>{
        const wsId = parseInt(req.params.wsId)
        console.log(req.body, wsId)
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
        const channelId = parseInt(req.params.id)
        console.log('channelID',channelId)
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
                members: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          first_name: true,
                          last_name: true,
                          username: true,
                          email: true,
                          avatar: true,
                          created_at: true,
                          updated_at: true,
                        },
                      },
                    },
                },
                messages: {
                  orderBy: { created_at: 'asc' },
                //   take: 30,
                  include: {
                    sender: {
                      select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        username: true,
                        avatar: true,
                      },
                    },
                    recipient: {
                      select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        username: true,
                        avatar: true,
                      },
                    },
                },
            },
        }
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
        const channelId = parseInt(req.params.channelId)
        const { userIds } = req.body
        
        try {
            // Filter out user IDs that are already members of the channel
            const existingMembers = await prisma.channelMember.findMany({
              where: {
                channel_id: channelId,
                user_id: { in: userIds },
              },
              select: { user_id: true },
            });
        
            const existingUserIds = existingMembers.map((member) => member.user_id);
            const newUserIds = userIds.filter((userId) => !existingUserIds.includes(userId));
        
            // Create channel members for new user IDs only
            const channelMembers = newUserIds.map((userId) => ({
              channel_id: Number(channelId),
              user_id: Number(userId),
            }));
        
            const createdMembers = await prisma.channelMember.createMany({
              data: channelMembers,
              skipDuplicates: true,
            });
        
            res.status(201).json({ message: 'Members added successfully' });
          } catch (error) {
            throw error;
          }
    }),

    getMembers: async(async(req,res)=>{
        const channelId = parseInt(req.params.channelId)
        try {
    
            const channelMembers = await prisma.channelMember.findMany({
                where: {
                    channel_id: channelId,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            username: true,
                            email: true,
                            avatar: true,
                        },
                    },
                },
            });

            res.status(200).json({ channelMembers });
            
        } catch (error) {
            throw error
        }
    })
}


export default  channelController