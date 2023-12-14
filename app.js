const axios = require("axios");
const express = require("express");
const app = express();
const path = require("path");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

const {MongoClient, ServerApiVersion} = require("mongodb");
require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env') });
process.stdin.setEncoding("utf8");

app.set("views", path.resolve(__dirname + "/templates"));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/static"));

async function main() {

    // Check for correct number of arguments
    if (process.argv.length != 2) {
        console.log(`Usage: node app.js`);
        process.exit(1);
    }

    // Connection variables
    const portNumber = 4000;
    const uri = process.env.MONGO_CONNECTION_STRING;
    const databaseAndCollection = {db: process.env.MONGO_DB_NAME , collection: process.env.MONGO_COLLECTION};
    const client = new MongoClient(uri, {serverApi: ServerApiVersion.v1});
    
    try {
        await client.connect();

        // Index page
        app.get("/", (request, response) => response.render("index"));
        
        // Adding destination
        app.get("/addDestination", (request, response) => {
            let variables = {
                city: "",
                country: "",
                region: ""
            };

            if (request.query.city !== undefined) {
                variables["city"] = request.query.city;
                variables["country"] = request.query.country;
                variables["region"] =  request.query.region;
            }
            
            response.render("form", variables);
            
        });
        app.post("/addDestination", (request, response) => {
            const date = new Date();
            const variables = {
                city: request.body.city,
                country: request.body.country,
                region: request.body.region,
                date: request.body.date,
                notes: request.body.notes,
                dateAndTime: date.toLocaleString("en-US", {timeZone: "America/New_York"}) + " - EST (New York)"
            };
            (async function() {await insertDestination(client, databaseAndCollection, variables)})();
            response.render("submission", variables);
        });

        // Getting place details *REQUIRES SUBSCRIPTION*
        app.get("/getCityDetails", (request, response) => response.render("lookup"));
        app.post("/CityDetails", (request, response) => {
            (async function() {return await getCityDetails(request.body.city)})()
            .then((result) => {
                let output;
                if (result === undefined)
                    output = "Error Retrieving information";
                else {
                    output = `<table><thead><tr><th>Name</th><th>Region</th><th>Country</th>
                            <th>Population</th><th>Latitude</th><th>Longitude</th></tr></thead></tbody>`;
                    sortedResult = result.sort((a, b) => (b.population > a.population) ? 1 : ((a.population > b.population) ? -1 : 0));
                    sortedResult.forEach((elem) => {
                        output += `<tr><td>${elem.name}</td><td>${elem.region}</td>`;
                        output += `<td>${elem.country}</td><td>${elem.population}</td>`;
                        output += `<td>${elem.latitude}</td><td>${elem.longitude}</td>`;
                        output += `<td><form action="/addDestination" method="get">
                            <input type="hidden" name="city" value="${elem.city}">
                            <input type="hidden" name="country" value="${elem.country}">
                            <input type="hidden" name="region" value="${elem.region}">
                            <input type="submit" value="Add" /></form></td?</tr>`;
                    });
                    output += "</tbody></table>";
                }
                const date = new Date();
                const variables = {
                    city: request.body.city,
                    result: output,
                    dateAndTime: date.toLocaleString("en-US", {timeZone: "America/New_York"}) + " - EST (New York)"
                };
                response.render("details", variables);
            });
        });
        
        // Review itinerary
        app.get("/reviewItinerary", (request, response) => {
            let count = 0;
            let output = "<table><tr><th>Date</th><th>City</th><th>Region</th><th>Country</th><th>Details</th></tr>";
            (async function() {return await lookUpMany(client, databaseAndCollection, {})})()
            .then((result) => {
                result.forEach(elem => {
                    count++;
                    output += `<tr><td>${elem.date}</td><td>${elem.city}</td><td>${elem.region}</td><td>${elem.country}</td><td>${elem.notes}</td></tr>`;
                });
                output += "</table>";
                if (count === 0) {
                    output = "<p>Your itinerary is empty! Press \"Add Destination\" to get started.</p>"
                }
                const date = new Date();
                const variables = {
                    itinerary: output,
                    dateAndTime: date.toLocaleString("en-US", {timeZone: "America/New_York"}) + " - EST (New York)"
                };
                response.render("itinerary", variables);
            });
        });

        // Remove a destination
        app.get("/removeDestination", (request, response) => response.render("remove"));
        app.post("/removeDestination", (request, response) => {
            const filter = {
                city: request.body.city,
                country: request.body.country,
                region: request.body.region,
                date: request.body.date
            };
            (async function() {return await deleteOne(client, databaseAndCollection, filter)})()
            .then((numRemoved) => {
                const date = new Date();
                const variables = {
                    city: request.body.city,
                    country: request.body.country,
                    region: request.body.region,
                    date: request.body.date,
                    numRemoved: numRemoved,
                    dateAndTime: date.toLocaleString("en-US", {timeZone: "America/New_York"}) + " - EST (New York)"
                };
                if (numRemoved > 0) {
                    response.render("removed", variables);
                } else {
                    response.render("failed", variables);
                }
            });
        });

        // Clear travel itinerary
        // app.get("/clearItinerary", (request, response) => response.render("index"));
        app.post("/clearItinerary", (request, response) => {
            (async function() { return await clearItinerary(client, databaseAndCollection)})()
            .then((numRemoved) => {
                const date = new Date();
                const variables = {
                    numRemoved: numRemoved,
                    dateAndTime: date.toLocaleString("en-US", {timeZone: "America/New_York"}) + " - EST (New York)"
                };
                response.render("cleared", variables);
            });
        });

        // Start web server
        app.listen(portNumber);
        console.log(`Web server started and running at http://localhost:${portNumber}`);

        // Process commands
        const prompt = "Stop to shutdown the server: ";
        process.stdout.write(prompt);
        process.stdin.on("readable", function () {
            let input = process.stdin.read();
            
            if (input !== null) {
                let query = input.trim();

                if (query === "stop") { // End program if stop command given
                    console.log("Shutting down the server");
                    client.close();
                    process.exit(0);
                } else {
                    console.log(`Invalid command: ${query}`);
                }
                process.stdout.write(prompt);
                process.stdin.resume();
            }
        });

    } catch (e) {
        console.error(e);
        client.close();
    }
}


async function clearItinerary(client, databaseAndCollection) {
    const result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .deleteMany({});
    
    return result.deletedCount;
}

async function deleteOne(client, databaseAndCollection, filter) {
    const result = await client.db(databaseAndCollection.db)
                   .collection(databaseAndCollection.collection)
                   .deleteOne(filter);
    
    return result.deletedCount;
}

async function getCityDetails(city) {
    const options = {
        method: 'GET',
        url: 'https://wft-geo-db.p.rapidapi.com/v1/geo/cities',
        params: {
          types: 'CITY',
          namePrefix: city,
          limit: '10'
        },
        headers: {
          'X-RapidAPI-Key': '30d10222d1mshbd5ad45a08feb0dp1aba47jsnae456190d9bd',
          'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        const result = await response.data.data;
        return result;
    } catch (error) {
        return undefined;
    }
}

async function insertDestination(client, databaseAndCollection, newDest) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newDest);
    return result.insertedId;
}

async function lookUpMany(client, databaseAndCollection, filter) {
    const cursor = client.db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .find(filter);

    const result = await cursor.toArray();
    return result;
}

async function lookUpOne(client, databaseAndCollection, dest) {
    let filter = {destination: dest};
    const result = await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .findOne(filter);

   return result;
}


main().catch(console.error);