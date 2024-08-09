import {prisma} from '../db/index.js'
import async from 'express-async-handler'
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import AuthController from './AuthController.js';
import bcrypt from 'bcrypt'
const saltRounds = 10


// Function to generate a unique invitation token
function generateInvitationToken(wsId) {
    
    const token = `${crypto.randomBytes(16).toString('hex')}-${wsId}`;
    return token
}

const workspaceController = {
    create: async(async(req,res)=>{
      console.log(req.body)
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
            // create general channel
            let generalChannel = await prisma.channel.create({
              data:{
                  workspace_id:newWorkspace.id,
                  name:'general',
                  avatar:null,
                  cover:null,
                  is_general: true
              }
          })
            // add creator to channelmember
            let chm = await prisma.channelMember.create({
              data:{
                   channel_id: generalChannel.id,
                   user_id: parseInt(req.user.userId),
              }
           })
            return res.status(201).json(newWorkspace)
        }catch(e){
            throw e
        }
    }),

    getWorkSpaces: async(async(req,res)=>{
        let wspcs = await prisma.workspace.findMany({
            where:{
                members:{
                    some:{
                        user_id:parseInt(req.user.userId)
                    }
                }
            },
            include: {
                // owner: true, 
                // channels: true, // Include associated channels
                // members: true, 
            },
        })
        return res.status(200).json(wspcs)
    }),

    getChannel: async(async(req,res)=>{
        const wsId = parseInt(req.params.id)
        const channelId = parseInt(req.params.channelId)
        let ws = await prisma.channel.findUnique({
            where:{
                id:channelId,
                workspace_id:wsId,
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

    getWorkSpace: async(async(req,res)=>{
        const wsId = parseInt(req.params.id)
        let ws = await prisma.workspace.findUnique({
            where:{
                id:wsId,
                members:{
                  some:{
                      user_id: parseInt(req.user.userId)
                  }
              }
            },
            include: {
              channels: {
                where: {
                  members: {
                      some: {
                          user_id: parseInt(req.user.userId), 
                      },
                  },
                },
              }, 
              members: true, 
            },
        })
        if(!ws)
            return res.status(404).json({message:'workSpace not found'})   
        return res.status(200).json(ws)
    }),

    updateWorkSpace: async(async(req,res)=>{
        const wsId = parseInt(req.params.id)
        let {name,description,is_private,logo,cover} = req.body
        try{
            let updatedWs = await prisma.workspace.update({
                where:{
                    id:wsId,
                    ownerId:parseInt(req.user.userId),
                },
                data:{
                    name,
                    description,
                    is_private,
                    logo,
                    cover
                }
            })
            if(!updatedWs)
                return res.status(404).json({message:'workSpace not found'})   
            return res.status(200).json(updatedWs)
        } catch(e){
            throw e
        }
    }),

    deleteWorkSpace: async(async(req,res)=>{
        const wsId = parseInt(req.params.id)
        let ws = await prisma.workspace.delete({
            where:{
                id:wsId,
                ownerId:parseInt(req.user.userId)
            }
        })
        if(!ws)
            return res.status(404).json({message:'workSpace not found'}) 
        return res.status(204).json({message:'workspace deleted successfully'})   
    }),

    sendWorkspaceInvitation: async(async(req,res)=>{
      console.log(req.body)
        const workspaceId = parseInt(req.params.id)
        const { email } = req.body;
        try {
            // Check if the workspace exists
            const workspace = await prisma.workspace.findUnique({
              where: {
                id: workspaceId,
              },
            });
        
            if (!workspace) {
              return res.status(404).json({ error: 'Workspace not found' });
            }
        
            // Generate a unique invitation token
            const invitationToken = generateInvitationToken(workspaceId);
        
            // Create an invitation record in the database
            await prisma.workspaceInvitation.create({
              data: {
                email,
                workspace_id: workspaceId,
                token: invitationToken,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Invitation expires in 7 days
              },
            });

            const myEmail = process.env.EMAIL
            const myPass = process.env.PASS
        
            // Send the invitation email to the user
            // const transporter = nodemailer.createTransport({
            //   // Configure your email transport service
            //   host: 'smtp.example.com',
            //   port: 587,
        //   auth: {
            //     user: 'your-email@example.com',
            //     pass: 'your-password',
            //   },
            // });

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth:{
                    user:myEmail,
                    pass: myPass
                }
            })
        
            const invitationLink = `${process.env.FRONTEND_URL}/accept-invitation?invtoken=${invitationToken}`;
            const mailOptions = {
              from: myEmail,
              to: email,
              subject: 'Invitation to join a workspace',
            //   text: `You have been invited to join the "${workspace.name}" workspace. Please click the following link to accept the invitation: ${invitationLink}`,
            html: `
                <html>
                    <head>
                      <style>
                        /* Add your CSS styles here */
                        body {
                          font-family: Arial, sans-serif;
                          background-color: #f4f4f4;
                          padding: 20px;
                        }
                        .container {
                          background-color: white;
                          padding: 20px;
                          border-radius: 5px;
                          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        }
                        .button, a {
                          display: inline-block;
                          background-color: #98d9ff;
                          text-decoration: none;
                          color: #ffffff;
                          padding: 10px 20px;
                          border-radius: 5px;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <h2>You have been invited to join the "${workspace.name}" workspace!</h2>
                        <p>Please click the button below to accept the invitation:</p>
                        <a href="${invitationLink}" class="button">Accept Invitation</a>
                      </div>
                    </body>
                </html>`
            };
        
            await transporter.sendMail(mailOptions);
        
            return res.status(200).json({ message: `Invitation sent successfully to ${email}` });
          } catch (error) {
            console.error('Error sending workspace invitation:', error);
            return res.status(500).json({ error: 'Failed to send invitation' });
          }
    }),

    getUserEmail: async(async(req,res)=>{
      const token = req.query.token
      try{
        const invitation = await prisma.workspaceInvitation.findUnique({
          where: {
            token,
          },
          include:{
            workspace:true
          }
        });
        if (!invitation || invitation.expires_at < new Date()) {
          return res.status(404).json({ message: 'Invalid or expired invitation' });
        }

        const user = await prisma.user.findUnique({
          where:{
            email: invitation.email
          }
        })
        if(user){
          let workspaceMembership = await prisma.workspaceMember.findMany({
            where:{
              user_id:user.id,
              workspace_id: invitation.workspace_id
            }
          })

          if(workspaceMembership.length < 1){
            // Add the user to the workspace
            await prisma.workspaceMember.create({
              data: {
                user_id: user.id,
                workspace_id: invitation.workspace_id,
                is_owner: false,
              },
            })
          }

          let generalChannel = await prisma.channel.findMany({
            where:{
              workspace_id: invitation.workspace_id,
              is_general: true
            }
          })
          
          let generalChannelMembership = await prisma.channelMember.findMany({
            where:{
              user_id:user.id,
              channel_id: generalChannel[0].id
            }
          })

          if(generalChannelMembership.length < 1){
            await prisma.channelMember.create({
              data: {
                user: {
                  connect: { id: user.id }, // Connect to the existing user by ID
                },
                Channel: {
                  connect: { id: generalChannel[0].id },
                }
              },
            })
          }

          return res.status(201).json({message:'Invitation accepted!'})
        }
        return res.status(200).json({invitation})
      }catch(e){
        throw e
      }
    }),
    
    acceptWorkspaceInvitation: async(async (req, res)=>{
        const token  = req.query.token
        try {
          // Check if the invitation exists and is valid
          const invitation = await prisma.workspaceInvitation.findUnique({
            where: {
              token,
            },
          });

          if (!invitation || invitation.expires_at < new Date()) {
            return res.status(404).json({ error: 'Invalid or expired invitation' });
          }
          
          // create user
          let {firstName, lastName,username, email, password, avatar} = req.body
          if (!username || !email||!password){
              return res.status(400).json({message: 'username, email and password are required!'})
          }
          const hashedPass = await bcrypt.hash(password, saltRounds)
          const user = await prisma.user.create({
              data:{
                  first_name: firstName,
                  last_name: lastName,
                  username: username,
                  email:email,
                  password: hashedPass,
                  // avatar:null
              }
          })
          
          let generalChannel = await prisma.channel.findMany({
            where:{
              workspace_id: invitation.workspace_id,
              is_general: true
            }
          })

          // Add the user to the workspace
          await prisma.workspaceMember.create({
            data: {
              user_id: user.id,
              workspace_id: invitation.workspace_id,
              is_owner: false,
            },
          })

          await prisma.channelMember.create({
            data: {
              user: {
                connect: { id: user.id }, // Connect to the existing user by ID
              },
              Channel: {
                connect: { id: generalChannel[0].id },
              }
            },
          })

          // update the invitation status to true
          await prisma.workspaceInvitation.update({
            where: {
              id: invitation.id,
            },
            data:{
              status:true
            }
          })

          return res.status(201).json({ message: 'Invitation accepted successfully & user account created' });
        } catch (error) {
          console.error('Error accepting workspace invitation:', error);
          return res.status(500).json({ error: 'Failed to accept invitation' });
        }
    }),

    getMembers: async(async(req,res)=>{
      let wsId = req.query.id
      let channelId = req.query.chId
      try {

      // Fetch all members of the workspace
      const workspaceMembers = await prisma.workspaceMember.findMany({
        where: {
            workspace_id: wsId,
        },
        include: {
            User: {
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

      // Fetch all members of the specified channel
      const channelMembers = await prisma.channelMember.findMany({
          where: {
              channel_id: channelId,
          },
          select: {
              user_id: true,
          },
      });

      // Extract user IDs from channel members
      const channelMemberIds = channelMembers.map(member => member.user_id);

      // Filter workspace members to exclude channel members
      const members = workspaceMembers.filter(member => !channelMemberIds.includes(member.User.user_id));

      res.status(200).json({members})

      } catch (error) {
        throw error
      }
    })
}


export default  workspaceController
