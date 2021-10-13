const route = require("express").Router()
const service = require("./modules/user_services")

route.post("/register" , service.register)
route.post("/login" , service.login)

module.exports = route;