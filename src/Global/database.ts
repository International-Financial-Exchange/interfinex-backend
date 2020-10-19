const { MongoClient } = require("mongodb");
const client = new MongoClient(
    "mongodb://172.17.0.1:27017", 
    { useUnifiedTopology: true, replicaSet: "initialReplSet" }
);

class Database {
    public db: any;
    static DB_NAME = "INTERMEX";
    
    async init() {
        console.log("Connecting to mongo server");
        await client.connect();
        this.db = client.db(Database.DB_NAME);

        console.log("Connected to mongo server");
    }
}

export const DATABASE = new Database();