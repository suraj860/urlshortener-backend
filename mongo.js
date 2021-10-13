const {MongoClient} = require("mongodb")

const client = new MongoClient(process.env.MONGODB_URL);
module.exports = {
    db: null,
    url : null,
    data:null,
    async connect(){
        await client.connect()
        console.log("dconnected to -" ,process.env.MONGODB_URL)
        this.db = client.db(process.env.MONGODB_NAME)
        console.log("selected dataBase-" , process.env.MONGODB_NAME)

        this.url = this.db.collection("urls")
        this.data = this.db.collection("data")
    }
}