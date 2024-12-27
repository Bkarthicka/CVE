import axios from 'axios';
import { MongoClient } from 'mongodb';

const API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const RESULTS_PER_PAGE = 2000;

const mongoURI = 'mongodb://localhost:27017';
const dbName = 'securin';
const collectionName = 'securin';

async function fetchCVEData(startIndex) {
    const params = {
        resultsPerPage: RESULTS_PER_PAGE,
        startIndex: startIndex
    };
    try {
        const response = await axios.get(API_URL, { params });
        return response.data;
    } catch (error) {
        console.error(`Error fetching data from API: ${error.message}`);
        return null;
    }
}

async function storeCVEData(client, cveData) {
    if (!cveData || !cveData.vulnerabilities) return;
    const vulnerabilities = cveData.vulnerabilities;
    try {
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        const existingCVEs = await collection.find().toArray();
        const existingCVEIds = existingCVEs.map(cve => cve._id);

        const uniqueDocuments = vulnerabilities.filter(vulnerability => !existingCVEIds.includes(vulnerability.cve.id))
            .map(vulnerability => ({
                _id: vulnerability.cve.id,
                cve: vulnerability.cve
            }));

        if (uniqueDocuments.length === 0) {
            console.log("No new CVEs to insert.");
            return;
        }

        await collection.insertMany(uniqueDocuments);
        console.log(`Stored ${uniqueDocuments.length} new records in the database.`);
    } catch (error) {
        console.error(`Error storing data in the database: ${error.message}`);
    }
}

async function synchronizeData() {
    const client = new MongoClient(mongoURI);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        let startIndex = 0;
        let totalResults = 0;

        while (true) {
            const cveData = await fetchCVEData(startIndex);
            if (!cveData) break;

            totalResults += cveData.totalResults || 0;
            await storeCVEData(client, cveData);

            if (startIndex + RESULTS_PER_PAGE >= totalResults) break;
            startIndex += RESULTS_PER_PAGE;
        }

    } catch (error) {
        console.error(`An error occurred: ${error.message}`);
    } finally {
        await client.close();
        console.log('Disconnected from MongoDB');
    }
}

async function main() {
    await synchronizeData();
    setTimeout(main, 24 * 60 * 60 * 1000);
}

main();
