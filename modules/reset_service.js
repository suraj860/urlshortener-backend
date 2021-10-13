const  db  = require("../mongo");
const shortid = require ("shortid")
const bcrypt = require ("bcrypt");
const nodemailer = require("nodemailer")
const crypto = require("crypto")

const services = {

    async resets (req,res){
    //sending mail for users mailid for verification
    //using crypto for generating a token and sending it to user mail and later verfying it
    //usind nodemailer to send the mail

        crypto.randomBytes(32 ,async(err,buffer)=>{
            if(err){
                console.log(err)
            }
            const emailToken = buffer.toString("hex")
            const userEmail = await db.data.findOne({email : req.body.email})
            if(userEmail){
               db.data.updateOne({email : req.body.email},{$set:{reset : emailToken }})
               let transporter = nodemailer.createTransport({
                   service:"gmail",
                   auth:{
                       user:"surajpatil131297@gmail.com",
                       pass: "8605587104"
                   }
               });
               let mailOptions ={
                   from : "surajpatil131297@gmail.com",
                   to:req.body.email,
                   subject : "reset your password",
                   html : `
                   <p>click the <a href="http://surajurlshortner.netlify.app/reset/${emailToken}">link</a> to reset your password</p>
                   <p>valid for 24 hrs only</p>
                   `
    
               };
    
               transporter.sendMail(mailOptions , function(error , info){
                   if(error){
                       console.log(error);
                   }else{
                       console.log("email sent :" + info.response)
                       res.send({message :"check your mail"})
                   }
               });
            }else{
                res.send({message : "Enter valid mail"})
            }
        })
        
     },

    //resetting the passwordand saving new password to the database
     async newpassword (req , res){
        try{
           const salt = await bcrypt.genSalt()
           //save the password to database in encrypted form
           req.body.newpassword = await bcrypt.hash(req.body.newpassword , salt)
           //find a mail with the provided token
           const checkEmail = await db.data.findOne({reset:req.body.token})
              if(checkEmail){
            //if mail exists set the new password to that user
               await db.data.findOneAndUpdate({reset:req.body.token},
                   {$set:{password : req.body.newpassword , reset : undefined}})
                   return res.send({message: "password reseted successfully"})
              }else{
               return res.send({message:"something went wrong"})
              }
             
        }catch(err){
           res.status(400).send(err)
        }
       
    },

    //creating the url
    async createUrl(req , res){
        //find whether there allready shorturl is present for the provided url or not
        const searchUrl = await db.url.findOne({url:req.body.url})
        if(searchUrl){
            //if yes than send the saved url
            res.send(`http://surajurlshortner.netlify.app/redirection/${searchUrl.shortUrl}`)
        }else{
            //else generate a new url and send to the database
            const shortUrl = shortid.generate()
            const data = await db.url.insertOne({url:req.body.url , shortUrl : shortUrl})  
            res.send(`http://surajurlshortner.netlify.app/redirection/${shortUrl}`)
        }   
    },

//redirecting from short url to original url
    async redirection (req,res){
        console.log(req.params.id)
        const data = await db.url.findOne({shortUrl:req.params.id})
        if(data){
            console.log(data)
            res.send(data.url)
        }else{
            res.send("enter valid url")
        }
       
    }
}

module.exports = services ; 
