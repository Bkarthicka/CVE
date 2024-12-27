import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';

const app = express();
const PORT = 3000;

const mongoURI = 'mongodb://localhost:27017';
const dbName = 'securin';
const collectionName = 'securin';

app.use(cors());

(async () => {
    try {
        const client = await MongoClient.connect(mongoURI);
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        const serverStatus = await db.command({ ping: 1 });
        console.log('Database connected:', serverStatus);

        app.get('/fetchData', async (req, res) => {
            try {
                const limit = parseInt(req.query.limit) || 10;
                const page = parseInt(req.query.page) || 1;
                const skip = (page - 1) * limit;

                const totalDocuments = await collection.countDocuments();
                const cveData = await collection.find({}).skip(skip).limit(limit).toArray();

                res.json({
                    data: cveData,
                    total: totalDocuments,
                    page,
                    limit,
                });
            } catch (error) {
                console.error('Error fetching paginated data:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        app.get('/api/fetchCVEDetails', async (req, res) => {
            try {
                const cveId = req.query.id;
                if (!cveId) {
                    return res.status(400).json({ error: 'CVE ID is required' });
                }

                const cveDetails = await collection.findOne({ _id: cveId });
                if (!cveDetails) {
                    return res.status(404).json({ error: 'CVE not found' });
                }

                res.json(cveDetails);
            } catch (error) {
                console.error('Error fetching CVE details:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
})();
