import async from 'express-async-handler'
import {prisma} from '../db/index.js'
import bcrypt from 'bcrypt'
import {generateToken} from '../utils/jwtutils.js'

const saltRounds = 10

const authController = {
    register: async(async(req,res)=>{
        let {firstName, lastName,username, email, password, avatar} = req.body
        if (!username || !email||!password){
            return res.status(400).json({message: 'username, email and password are required!'})
        }
        const user = await prisma.user.findUnique({
            where:{
                email:  email
            }
        })
        if(user){
            return res.status(409).json({message:'A user with this email already exists'})
        }
        console.log(req.body)
        
        const hashedPass = await bcrypt.hash(password, saltRounds)
        console.log(hashedPass)
        try{
            const newUser = await prisma.user.create({
                data:{
                    first_name: firstName,
                    last_name: lastName,
                    username: username,
                    email:email,
                    password: hashedPass,
                    // avatar:null
                }
            })

            delete newUser.password

            res.status(201).json(newUser)
        } catch(error){
            throw error
            return res.status(500).json({message:'Error ocurred: ', error})
        }
    }),

    login: async(async(req,res)=>{
        let {email, password} = req.body
        if(!email || !password){
            return res.status(400).json({message: 'email and password are required'})
        }
        try{
            const user = await prisma.user.findFirst({
                where:{
                    email:email,
                }
            })
            if(user){
                const passMatch = await bcrypt.compare(password, user.password)
                if(passMatch){
                   const token = generateToken({userId: user.id})
                   delete user.password
                   return res.status(200).json({user, token:token})
                } else {
                    return res.status(401).json({message: 'Incorrect Password'})
                }
            } else {
                return res.status(404).json({message:'no user with this email'})
            }
        } catch(error){
            res.status(500).json({message: error})
        }
    }),

    logout: async( async(req, res)=>{
        res.clearCookie('token')
        res.status(200).json({message:'logged out'})
    })
}

export default authController