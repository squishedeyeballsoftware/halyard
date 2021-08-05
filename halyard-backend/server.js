const express = require('express');
const cors = require('cors');
const http = require('http');
const { MongoClient, Server } = require('mongodb');
const { Client } = require('pg');
const echoURL = process.env.HALYARD_ECHO || 'http://localhost:8000';
const mongoURL = process.env.HALYARD_DATABASE || 'mongodb://localhost:27017';
const backendAPIPort = process.env.HALYARD_API_PORT || '3000';
const backendAPIHost = process.env.HALYARD_API_HOST || 'localhost';
const mongoDB = new URL(mongoURL);
const version = process.env.HALYARD_VERSION || 'Version 1.1';
const mongoClient = new MongoClient(new Server(mongoDB.hostname, mongoDB.port));
const pguser = process.env.PGUSER || 'root';
const pghost = process.env.PGHOST || 'halyard-headless-ext-postgres';
const pgpass = process.env.PGPASSWORD || 'Macro7!';
const pgdata = process.env.PGDATABASE || 'postgres';
const pgport = process.env.PGPORT || 5432;
const outsideURL = process.env.OUTSIDEHOST || 'halyard-headless-ext';
const app = express();
app.use(cors({
    origin: '*'
}));
let mongodbState = 'Not connected to the Halyard INTERNAL database yet ' + mongoURL;
const databaseConnectCallback = (error) => {
    if (error) {
        mongodbState = 'Bummer - unable to connected to the Halyard INTERNAL database: ' + mongoURL;
        mongodbState = `${mongodbState}, Connect Error: ${error.message}.`;
        console.log(mongodbState);
    }
    else {
        mongodbState = 'Yay - connected to the Halyard INTERNAL database! ' + mongoURL;
        console.log(mongodbState);
    }
    mongoClient.close();
    return mongodbState;
};
let postgressConnection = `${pguser}:${pgpass}@${pghost}:${pgport}/${pgdata}`;
let postgresState = 'Not connected to the Halyard EXTERNAL database yet ' + postgressConnection;
const startPG = async () => {
    console.log(`trying: ${postgressConnection}`);
    const client = new Client({
        user: pguser,
        host: pghost,
        database: pgdata,
        password: pgpass,
        port: pgport,
    });
    return await client.connect();
};
startPG().then(() => {
    postgresState = 'Yay - connected to the Halyard EXTERNAL database! ' + postgressConnection;
    console.log(postgresState);
}).catch((err) => {
    postgresState = 'Bummer - unable to connected to the Halyard EXTERNAL database: ' + postgressConnection + ' Error: ' + err;
    console.log(postgresState);
});
const getHandler = (req, res) => {
    console.log("Request: ", req.headers);
    let retVal = '';
    const readHandler = (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
            data += chunk;
        });
        resp.on('end', () => {
            retVal = `${version} </br></br>${mongodbState} </br></br> ${postgresState} </br></br> Echo Service Response: ${data.replace(/[\n\r]/g, '</br>')}`;
            res.send({
                'data': retVal
            });
        });
    };
    const readErrorHandler = (err) => {
        retVal = `${version} </br></br> ${mongodbState} </br></br> ${postgresState} </br></br> Echo Service Error: ${err.message}`;
        res.send({
            'data': retVal
        });
    };
    http.get(echoURL, readHandler).on("error", readErrorHandler);
    return { readHandler, readErrorHandler };
};
const outsideHandler = (req, res) => {
    console.log("Request: ", req.headers);
    let retVal = '';
    const readHandler = (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
            data += chunk;
        });
        resp.on('end', () => {
            retVal = `${version} </br></br> Outside Service Response: ${data.replace(/[\n\r]/g, '</br>')}`;
            res.send({
                'data': retVal
            });
        });
    };
    const readErrorHandler = (err) => {
        retVal = `${version}  </br></br> Outside Service Error: ${err.message}`;
        res.send({
            'data': retVal
        });
    };
    http.get(outsideURL, readHandler).on("error", readErrorHandler);
    return { readHandler, readErrorHandler };
};
const pingHandler = (req, res) => {
    console.log("Ping Request: ", req.headers);
    res.send({
        'data': `Halyard-Backend: ${version}`
    });
};
const sailsHandler = (req, res) => {
    console.log("Sails Request: ", req.headers);
    res.send((version === 'Version 1.1') ? 'down' : 'up');
};
app.get('/api', getHandler);
app.get('/', pingHandler);
app.get('/ping', pingHandler);
app.post('/ping', pingHandler);
app.put('/ping', pingHandler);
app.delete('/ping', pingHandler);
app.get('/sails', sailsHandler);
app.get('/outside', outsideHandler);
const serviceHandler = function () {
    console.log('listening on ' + backendAPIPort);
    console.log('version ', version);
};
app.listen(backendAPIPort, serviceHandler);
module.exports = { app, databaseConnectCallback, sailsHandler, pingHandler, getHandler, serviceHandler, echoURL, version, mongoURL };
//# sourceMappingURL=server.js.map