"use strict"

/* Packages */
import Koa            from "koa"
import Router         from "@koa/router"
import { bodyParser } from "@koa/bodyparser"

/* Libraries */
import OCPPService     from "./lib/OCPPService"
import NetworkDatabase from "./lib/Database/NetworkDatabase"
import EventsDatabase  from "./lib/Database/EventsDatabase"

/* Local */
const ocppService = new OCPPService({
    ocppConnector: {
        protocols: [ "ocpp1.6", "ocpp2.0.1" ],
        hostname : process.env.HOSTNAME,
        wsport   : process.env.OCPP_PORT,
        ip       : process.env.IP,
        tls      : {
            keyPath    : "./server.key",
            certPath   : "./server.crt",
            sanConfPath: "./openssl-san.cnf"
        }
    },
    eventsDatabase: new EventsDatabase({
        protocol: "http",
        hostname: process.env.EVENTS_DB_HOSTNAME,
        port    : process.env.EVENTS_DB_PORT,
        index   : process.env.EVENTS_DB_INDEX,
        auth    : {
            username: process.env.EVENTS_DB_USERNAME,
            password: process.env.EVENTS_DB_PASSWORD
        },
        tls     : {
            rejectUnauthorized: false
        }
    }),
    networkDatabase: new NetworkDatabase({
        credentials  : {
            username: process.env.NETWORK_DB_USERNAME,
            password: process.env.NETWORK_DB_PASSWORD,
        },
        configuration: {
            protocol: process.env.NETWORK_DB_BOLT_PROTOCOL,
            hostname: process.env.NETWORK_DB_HOSTNAME,
            port    : process.env.NETWORK_DB_BOLT_PORT
        }
    })
})
ocppService.listen()


const evseServer = new Koa()
const evseCommandRouter = new Router( { prefix: "/evse/command" } )

evseCommandRouter.get("/:serialNumber",
                        ( { params: { serialNumber }, request:{ body: { command, event } } } ) =>
                            ocppService.emit(`ChargerCommand:${serialNumber}`, { command, event } ) )

evseServer.use( bodyParser() )
evseServer.use( evseCommandRouter.routes() )
evseServer.use( evseCommandRouter.allowedMethods() )
evseServer.listen( process.env.HTTP_PORT )

// const amqp = new Object()
// const amqpConn = amqp.connect()
// const topic = amqpConn.topic( "/evse/command/:serialNumber/:command" )
// topic.on( "message", message => {
//     const { serialNumber, command, payload } = JSON.parse( message )
//     ocppService.emit( `ChargerCommand:${serialNumber}`, { command, payload } )
//     amqp.emit(`/evse/update/${serialNumber}/${command}`)
// })