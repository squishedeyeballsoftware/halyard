const express = require('express');
const cors = require('cors');
const http = require('http');
const { MongoClient, Server } = require('mongodb');
const echoURL = process.env.HALYARD_ECHO || 'http://localhost:8000';
const mongoURL = process.env.HALYARD_DATABASE || 'mongodb://localhost:27017';
const backendAPIPort = process.env.HALYARD_API_PORT || '3000';
const backendAPIHost = process.env.HALYARD_API_HOST || 'localhost';
const mongoDB = new URL(mongoURL);
const version = process.env.HALYARD_VERSION || 'Version 1.0';
const mongoClient = new MongoClient(new Server(mongoDB.hostname, mongoDB.port));
const app = express();
app.use(cors({
    origin: '*'
}));
let mongodbState = 'Not connected to the Halyard database yet';
const databaseConnectCallback = (error) => {
    if (error) {
        mongodbState = 'Bummer - unable to connected to the Halyard database: ' + mongoURL;
        mongodbState = `${mongodbState}, Connect Error: ${error.message}.`;
    }
    else {
        mongodbState = 'Yay - connected to the Halyard database! ' + mongoURL;
    }
    mongoClient.close();
    return mongodbState;
};
mongoClient.connect(databaseConnectCallback);
const getHandler = (req, res) => {
    console.log("Request: ", req.headers);
    let retVal = '';
    const readHandler = (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
            data += chunk;
        });
        resp.on('end', () => {
            retVal = `${version} </br></br>${mongodbState} </br></br> Echo Service Response: ${data.replace(/[\n\r]/g, '</br>')}`;
            res.send({
                'data': retVal
            });
        });
    };
    const readErrorHandler = (err) => {
        retVal = `${version} </br></br> ${mongodbState}</br></br> Echo Service Error: ${err.message}`;
        res.send({
            'data': retVal
        });
    };
    http.get(echoURL, readHandler).on("error", readErrorHandler);
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
    res.send((version === 'Version 1.0') ? 'down' : 'up');
};
app.get('/api', getHandler);
app.get('/', pingHandler);
app.get('/ping', pingHandler);
app.post('/ping', pingHandler);
app.put('/ping', pingHandler);
app.delete('/ping', pingHandler);
app.get('/sails', sailsHandler);
const serviceHandler = function () {
    console.log('listening on ' + backendAPIPort);
    console.log('version ', version);
};
app.listen(backendAPIPort, serviceHandler);
module.exports = { app, databaseConnectCallback, sailsHandler, pingHandler, getHandler, serviceHandler, echoURL, version, mongoURL };
//# sourceMappingURL=server.js.map