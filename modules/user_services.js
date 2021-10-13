const db = require ("../mongo")
const bcrypt = require ("bcrypt");
const jwt = require ("jsonwebtoken");

const services ={
    //if new user register
    async register (req, res){
        try{
            //find whether any other user exists with the same email id or not 
            const user = await db.data.findOne({email : req.body.email})
            if(user){
               return  res.send({message :"User Already exists"})
            }else{
                //not than inset the information of new user to the database
                const salt = await bcrypt.genSalt()
                req.body.password = await bcrypt.hash(req.body.password , salt)
                await db.data.insertOne(req.body)
                return res.send({message :"Registered successfully"})
            }
        }catch(error){
            res.status(500).send("something went wrong")
        }
      
    },

    //checking for log in
    async login (req , res){
        try{
            //check presence of email
            const user = await db.data.findOne({email : req.body.email})
        if(!user){
            return res.send({message : "Enter valid Email-Id"})
        }else{
            //chect the password entered by user compare the password by decodeing usind bcrypt comparer
            const isValid = await bcrypt.compare(req.body.password , user.password)
            if(isValid){
                //if pass is valid give token
                const authToken = jwt.sign({user_id : user._id , email: user.email} , "admin123",{expiresIn :"24h"})
                console.log(authToken)
                return res.send({authToken , message: "Logged In Successfully" , name:user.name})
            }else{
                //not then throw error
                res.send({message : "Entered password is wrong"})
            }
         } 
        }catch(error){
            res.status(500).send("something went wrong try again")
        }
       
   
    }
}

module.exports = services ; 