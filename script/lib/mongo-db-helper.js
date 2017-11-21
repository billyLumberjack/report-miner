var MongoClient = require('mongodb').MongoClient;
//var url = "mongodb://root:root@cluster0-shard-00-00-shxrr.mongodb.net:27017,cluster0-shard-00-01-shxrr.mongodb.net:27017,cluster0-shard-00-02-shxrr.mongodb.net:27017/MyDatabase?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin";
//var collection_name = "test-report-collection";

module.exports = class MongoDbHelper {

    constructor(url, collection_name){
        this.url = url;
        this.collection = collection_name;
    }

    putReport(obj) {
        MongoClient.connect(this.url, (err, db)=>{
            if (err) throw (err);
            db.collection(this.collection).insertOne(obj, function (err, res) {
                if (err) throw err;
                db.close();
            });
        });

    }
}