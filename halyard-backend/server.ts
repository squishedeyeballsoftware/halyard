const express = require('express')
const cors = require('cors')
const http = require('http')
const { MongoClient, Server } = require('mongodb')
const { Client } = require('pg')

// To route to Echo Server: Same namespace: servicename:port, Different namespace: servicename.namespace:port
const echoURL = process.env.HALYARD_ECHO || 'http://localhost:8000'
const mongoURL = process.env.HALYARD_DATABASE || 'mongodb://localhost:27017'
const backendAPIPort = process.env.HALYARD_API_PORT || '3000'
const backendAPIHost = process.env.HALYARD_API_HOST || 'localhost'
const mongoDB = new URL(mongoURL)
const version = process.env.HALYARD_VERSION || 'Version 1.1'

const mongoClient = new MongoClient(new Server(mongoDB.hostname, mongoDB.port));

const pguser = process.env.PGUSER || 'doadmin'
const pghost = process.env.PGHOST || 'halyard-headless-ext-postgres'
const pgpass = process.env.PGPASSWORD || 'ypfouyw3ycj99q75'
const pgdata = process.env.PGDATABASE || 'defaultdb'
const pgport = process.env.PGPORT || 25060

const pguser2 = process.env.PGUSER2 || 'root'
const pghost2 = process.env.PGHOST2 || 'halyard-headless-ext-postgres-outside'
const pgpass2 = process.env.PGPASSWORD2 || 'Macro7!'
const pgdata2 = process.env.PGDATABASE2 || 'defaultdb'
const pgport2 = process.env.PGPORT2 || 5432

const outsideURL = process.env.OUTSIDEHOST || 'halyard-headless-ext'

const app = express()
app.use(cors({
    origin: '*'
}))

let mongodbState = 'Not connected to the Halyard INTERNAL database yet ' + mongoURL

const databaseConnectCallback = (error) => {
    if (error) {
        mongodbState = 'Bummer - unable to connected to the Halyard INTERNAL database: ' + mongoURL
        // console.log(mongodbState)
        mongodbState = `${mongodbState}, Connect Error: ${error.message}.`
        console.log(mongodbState)
    } else {
        mongodbState = 'Yay - connected to the Halyard INTERNAL database! ' + mongoURL
        console.log(mongodbState)
    }
    mongoClient.close()
    return mongodbState
}
mongoClient.connect(databaseConnectCallback)

let postgresConnection = `${pguser}:${pgpass}@${pghost}:${pgport}/${pgdata}`
let postgresConnection2 = `${pguser2}:${pgpass2}@${pghost2}:${pgport2}/${pgdata2}`;

let postgresState = 'Not connected to the Halyard EXTERNAL database yet ' + postgresConnection
let postgresState2 = 'Not connected to the Halyard EXTERNAL database outside yet ' + postgresConnection2;

const startPG = async () => {
    console.log(`trying: ${postgresConnection}`)
    const client = new Client({
        user: pguser,
        host: pghost,
        database: pgdata,
        password: pgpass,
        port: pgport,
        ssl: true,
    })

    try {
        await client.connect()
    } catch (error) {
        postgresState = 'Yay - connected to the Halyard EXTERNAL database: ' + postgresConnection2 + ' but with error: ' + error;

        console.log("Connect warning PG: ", error)
    }
}

startPG().then(() => {
    postgresState = 'Yay - connected to the Halyard EXTERNAL database! ' + postgresConnection;
    console.log(postgresState);
}).catch((err) => {

    postgresState = 'Bummer - unable to connected to the Halyard EXTERNAL database: ' + postgresConnection + ' Error: ' + err;
    console.log(postgresState);
})

const startPG2 = async () => {
    console.log(`trying: ${postgresConnection2}`)
    const client = new Client({
        user: pguser2,
        host: pghost2,
        database: pgdata2,
        password: pgpass2,
        port: pgport2,
        ssl: true,
    })

    try {
        await client.connect()
    } catch (error) {
        postgresState2 = 'Yay - connected to the Halyard EXTERNAL database: ' + postgresConnection + ' but with error: ' + error;

        console.log("Connect warning PG 2: ", error)
    }}
startPG2().then(() => {
    postgresState2 = 'Yay - connected to the Halyard EXTERNAL database outside! ' + postgresConnection2;
    console.log(postgresState2);
}).catch((err) => {
    postgresState2 = 'Bummer - unable to connected to the Halyard EXTERNAL database outside: ' + postgresConnection2 + ' Error: ' + err;
    console.log(postgresState2);
})

const getHandler = (req, res) => {
    console.log("Request: ", req.headers)
    let retVal = ''
    const readHandler = (resp) => {
        let data = ''
        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            data += chunk
        })
        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            retVal = `${version} </br></br>${mongodbState} </br></br> ${postgresState} </br></br> Echo Service Response: ${
                data.replace(/[\n\r]/g,'</br>')
            }`

            res.send({
                'data': retVal
            })
        })
    }

    const readErrorHandler = (err) => {
        retVal = `${version} </br></br> ${mongodbState} </br></br> ${postgresState} </br></br> Echo Service Error: ${err.message}`
        res.send({
            'data': retVal
        })
    }
    http.get(echoURL, readHandler).on("error", readErrorHandler)
    return {readHandler, readErrorHandler}
}

const outsideHandler = (req, res) => {
    console.log("Request: ", req.headers)
    let retVal = ''
    const readHandler = (resp) => {
        let data = ''
        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            data += chunk
        })
        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            retVal = `${version} </br></br> Outside Service Response: ${
                data.replace(/[\n\r]/g,'</br>')
            }`

            res.send({
                'data': retVal
            })
        })
    }

    const readErrorHandler = (err) => {
        retVal = `${version}  </br></br> Outside Service Error: ${err.message}`
        res.send({
            'data': retVal
        })
    }
    http.get(outsideURL, readHandler).on("error", readErrorHandler)
    return {readHandler, readErrorHandler}
}

const pingHandler = (req, res) => {
    console.log("Ping Request: ", req.headers)
    res.send({
        'data': `Halyard-Backend: ${version}`
    })
}

const sailsHandler = (req, res) => {
    console.log("Sails Request: ", req.headers)
    res.send((version === 'Version 1.1') ? 'down' : 'up')
}

app.get('/api', getHandler)
app.get('/', pingHandler)
app.get('/ping', pingHandler)
app.post('/ping', pingHandler)
app.put('/ping', pingHandler)
app.delete('/ping', pingHandler)
app.get('/sails', sailsHandler)
app.get('/outside', outsideHandler)

const serviceHandler = function () {
    console.log('listening on ' + backendAPIPort)
    console.log('version ', version)
}

// app.listen(backendAPIPort, backendAPIHost, serviceHandler)
app.listen(backendAPIPort, serviceHandler)

// export for unit tests.
module.exports = { app, databaseConnectCallback, sailsHandler, pingHandler,
    getHandler, serviceHandler, echoURL, version, mongoURL, postgresConnection }  // Exported for unit testing.
