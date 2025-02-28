"use strict"
/* Paackages */
import { RPCServer }                      from "ocpp-rpc"

/* Libraries */
import OCPPService                        from "./lib/OCPPService"
import Database                           from "./lib/Database"
import * as clientEvents                  from "./lib/Events"

/* Local */
const ocppService = new OCPPService({
    ocppConnector: {
        server  : new RPCServer({
            protocols                : [ 'ocpp1.6','ocpp2.0.1' ],
            strictMode               : true,
            pingIntervalMs           : 400000,
            respondWithDetailedErrors: true
        }),
        clientEvents,
        hostname: process.env.HOSTNAME,
        port    : process.env.PORT,
        ip      : process.env.IP,
        tls     : {
            keyPath    : "./server.key",
            certPath   : "./server.crt",
            sanConfPath: "../openssl-san.cnf"
        }
    },
    database: new Database({
        credentials  : {
            username: "neo4j",
            password: "password"
        },
        configuration: {
            protocol: "neo4j",
            host    : "neo4j",
            port    : "7687"
        }
    })
})

ocppService.listen()


// const expressServer = new Object()
// const expressRouter = new Object()
// const EventShape = []

// expressRouter.get("/evse/command/:serialNumber/:command", ( serialNumber, command ) => {
//     const payload = EventShape[command]
//     ocppService.emit(`ChargerCommand:${serialNumber}`, { command, payload } )
// })
// expressServer.listen( expressRouter )

// const amqp = new Object()
// const amqpConn = amqp.connect()
// const topic = amqpConn.topic( "/evse/command/:serialNumber/:command" )
// topic.on( "message", message => {
//     const { serialNumber, command, payload } = JSON.parse( message )
//     ocppService.emit( `ChargerCommand:${serialNumber}`, { command, payload } )
//     amqp.emit(`/evse/update/${serialNumber}/${command}`)
// })