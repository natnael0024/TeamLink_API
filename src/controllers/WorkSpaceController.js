import {prisma} from '../db/index.js'
import async from 'express-async-handler'
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Function to generate a unique invitation token
function generateInvitationToken(wsId) {
    
    const token = `${crypto.randomBytes(16).toString('hex')}-${wsId}`;
    return token
}

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
                channels: true, // Include associated channels
                members: true, 
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
                ownerId:parseInt(req.user.userId)
            },
            include: {
                channels:true,
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
        
            const invitationLink = `${process.env.BASE_URL}/accept-invitation?token=${invitationToken}`;
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
                        .button {
                          display: inline-block;
                          background-color: #007bff;
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
    
    acceptWorkspaceInvitation: async(async (req, res)=>{
        const { token } = req.query;
      
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
      
          // Check if the user already exists
          let user = await prisma.user.findUnique({
            where: {
              email: invitation.email,
            },
          });
      
          if (!user) {
            // Create a new user account
            user = await prisma.user.create({
              data: {
                email: invitation.email,
                password: '123456', // Set a temporary password, user can change it later
              },
            });
          }

          // Add the user to the workspace
          await prisma.workspaceMember.create({
            data: {
              user_id: user.id,
              workspace_id: invitation.workspace_id,
              is_owner: false,
            },
          });

        // Delete the invitation
        //   await prisma.workspaceInvitation.delete({
        //     where: {
        //       id: invitation.id,
        //     },
        //   });
      
          return res.status(200).json({ message: 'Invitation accepted successfully & user account created' });
        } catch (error) {
          console.error('Error accepting workspace invitation:', error);
          return res.status(500).json({ error: 'Failed to accept invitation' });
        }
      })
}


export default  workspaceController
