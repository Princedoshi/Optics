const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const mainUri = process.env.MONGO_URI;
const backupUri = process.env.BACKUP_URI;

const collections = ["formdatas", "users", "purchasehistories", "branches"];

async function syncDatabases() {
    const mainClient = new MongoClient(mainUri);
    const backupClient = new MongoClient(backupUri);

    try {
        await mainClient.connect();
        await backupClient.connect();

        const mainDb = mainClient.db("test");
        const backupDb = backupClient.db("backupDB");

        // console.log("Connected to both Atlas clusters. Starting sync...");

        for (const collectionName of collections) {
            const changeStream = mainDb.collection(collectionName).watch();
            changeStream.on("change", async (change) => {
                try {
                    switch (change.operationType) {
                        case "insert":
                            await backupDb.collection(collectionName).insertOne(change.fullDocument);
                            // console.log(`Inserted into ${collectionName}:`, change.fullDocument._id);
                            break;
                        case "update":
                            await backupDb.collection(collectionName).updateOne(
                                { _id: change.documentKey._id },
                                { $set: change.updateDescription.updatedFields }
                            );
                            // console.log(`Updated in ${collectionName}:`, change.documentKey._id);
                            break;
                        case "delete":
                            await backupDb.collection(collectionName).deleteOne({ _id: change.documentKey._id });
                            // console.log(`Deleted from ${collectionName}:`, change.documentKey._id);
                            break;
                    }
                } catch (err) {
                    console.error(`Error syncing ${collectionName}:`, err);
                }
            });
        }

        process.on("SIGINT", async () => {
            await mainClient.close();
            await backupClient.close();
            // console.log("Connections closed. Exiting...");
            process.exit(0);
        });

    } catch (err) {
        console.error("Failed to start sync:", err);
    }
}

module.exports = { syncDatabases };