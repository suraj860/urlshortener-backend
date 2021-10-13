require("dotenv").config();
const express = require("express");
const db = require("./mongo");
const app = express();
const cors = require("cors");
const Port = process.env.PORT || 5000;
const userRoutes = require("./user_routes");
const jwt = require("jsonwebtoken");
const service = require("./modules/reset_service");

async function connection() {
//connecting to database
  await db.connect();

//converting json data to stringify
  app.use(express.json());
  app.use(cors());

//user route for registeration and login
  app.use("/user", userRoutes);

//get all the created urls list
  app.get("/getUrls", async (req, res) => {
    const all = await db.url.find().toArray();
    res.send(all);
  });

//route for resetting the password
  app.post("/reset", service.resets);

//Route for setting new password
  app.post("/new_password", service.newpassword);

//middleware calling with the provided login token
  app.use((req, res, next) => {
    const token = req.headers["auth-token"];
    if (token) {
      try {
        req.user = jwt.verify(token, "admin123");
        console.log(req.user);
        next();
      } catch (err) {
        res.sendStatus(500);
      }
    } else {
      res.sendStatus(401);
    }
  });

//route for generating a new url
  app.post("/create_url", service.createUrl);

//route for redirecting from short url to long url
  app.get("/redirection/:id", service.redirection);

//running server
  app.listen(Port, () => {
    console.log("suraj your server started at " + Port);
  });
}

connection();
