let express = require('express');
let router = express.Router();
const { PythonShell } = require('python-shell')

router.post('/', async(req, res, next)=>{
  let session = req.body.session[0]
  // let userName = session.appUser.email
  let userName = "Pavan"
  let deviceId = session.device.deviceId
  let osVersion = session.device.devicePlatform.name
  let publicIPAddress = session.publicIPAddress
  let appId = session.appId
  // 12.988642168611857, 77.57457436772064
  // let latitude = session.latitude
  // let longitude = session.latitude
  let latitude = "12.988642168611857"
  let longitude = "77.57457436772064"
  let paramToPass = JSON.stringify([deviceId ,osVersion ,publicIPAddress ,appId , latitude, longitude])
  let options = {
    args : [userName , paramToPass]
  }

  // later add condition for mobile and windows

  PythonShell.run('new_web.py', options).then(messages=>{
    let data = JSON.parse(messages[0])
    return (
      res.status(200)
      .send({ status:true , data })
      )
  })
  .catch((err)=>{
    console.log(err)
    return (
      res.status(400)
      .send({status: false , data : "Error occurred!"})
    )
  })
  ;

});


module.exports = router;
