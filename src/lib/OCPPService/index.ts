"use strict"
/* NodeJS */
import { randomUUID as uuidv4 }                from "crypto"
import { exec }                                from "child_process"
import { readFileSync, writeFileSync, unlink } from "fs"
import https                                   from "https"

/* Packages */
import { RPCServer }                           from "ocpp-rpc"

/* Local */
import Base                                    from "../Base"
import { EVSEEvents }                          from "../Events"
import { TNetworkDatabase, TEventsDatabase }   from  "../Database/types"

export class OCPPService extends Base { // implements TOCPPService {
  id              : string             = uuidv4()

  #networkDatabase: TNetworkDatabase
  #eventsDatabase : TEventsDatabase
  #server         : RPCServer
  #ocppConnector  : {
    protocols: string[]
    hostname : string
    wsport   : string
    ip       : string
    tls      : {
      keyPath    : string
      certPath   : string
      sanConfPath: string
    }
  }

  constructor( options ){
    super()
    this.#networkDatabase = options.networkDatabase
    this.#ocppConnector = options.ocppConnector
    this.#server = new RPCServer({
        protocols                : this.#ocppConnector.protocols,
        strictMode               : true,
        pingIntervalMs           : 400000,
        respondWithDetailedErrors: true
    })


    this.on("processKill", async () => {
      if ( this.#networkDatabase.status.connected ) {
        await this.#networkDatabase.destroyOCPPService( this.id )
      }
    })

    this.#setup()
  }
  #setup(){
    if ( !this.#server ) {
      throw new Error( "No OCPP Connectors available, cannot get connections from chargers")
    }

    this.#server.auth( async (accept, reject, handshake) => {
      console.log("Attempting auth")
      const tlsClient = handshake.request.client
      if (!tlsClient) return reject( 0, "tls Failure" )
      // dblookup, identity(evse_SN, evse_pass->evse_pass_hash)
      const sessionId = uuidv4()
      accept( { sessionId, serialNumber: handshake.identity } )
      //-- setup connection in database
      if ( this.#networkDatabase.status.connected ){
        await this.#networkDatabase.createChargerRelationshipWithService({
          sessionId,
          serialNumber: handshake.identity,
          hostname    : this.#ocppConnector.hostname
        })
      }
    })

    this.#server.on( "client", async ( client ) => {

      console.log( `${client.session.sessionId} connected!` );
      this.on( `ChargerCommand:${client.session.serialNumber}`, ( { command, event } ) => {
        console.info( `ChargerCommand:${client.session.serialNumber}`, command, event )
        // Authenticate command's author
          // Server first
          // idTag
        
        // Send event to charger
        client.emit( command, event )
      })

      // Handle client events
      Object.entries( EVSEEvents )
            .forEach( ( [ name, fn ]:[ string, any] ) => {
              // Log Raw Event - Time Series?
              client.handle( name, (...args) => {
                console.log( `CHARGER EVENT[${name}]: ${args}`)
                this.#eventsDatabase.logEvent(
                                      `evse:${client.session.serialNumber}`,
                                      `occp-service:${this.id}`,
                                      { name, args }
                                    )
                fn( client, ...args)
              })
            })

      // create a wildcard handler to handle any RPC method
      client.handle(({method, params}) => {
        console.log( `Server got ${method} from ${client.identity}:`, params);
        throw new Error("Not Implemented");
      });

      client.on( "ping", ( ...args )        => console.log( "Pong", ...args ) )
      client.on( "disconnect", ( ...args )  => console.log( "Disconnect: ", ...args ) )
      client.on( "close", async ( ...args ) => {
        await this.#networkDatabase.destroyChargerRelationshipWithService({
          hostname    : this.#ocppConnector.hostname,
          sessionId   : client.session.sessionId,
          serialNumber: client.identity
        })
      })
    })

    writeFileSync(
      this.#ocppConnector.tls.sanConfPath,
      readFileSync( "./openssl-san.cnf.template", "utf-8" )
        .replaceAll( "{{CN}}", this.#ocppConnector.hostname )
        .replaceAll( "{{IP}}", this.#ocppConnector.ip )
    )
  }
  async listen(): Promise<void>{
    if ( this.#networkDatabase ) {
      await this.#networkDatabase.connect()
    }
    await new Promise<void>( async (resolve, reject) => {
      try {
        exec(`openssl req -x509 -nodes -newkey rsa:2048 -keyout ${this.#ocppConnector.tls.keyPath} -out ${this.#ocppConnector.tls.certPath} -days 365 -config ${this.#ocppConnector.tls.sanConfPath}`, () => {
          unlink( this.#ocppConnector.tls.sanConfPath, err => {
            if ( err ) throw err
            resolve()
          })
        })
      } catch ( e ){
        reject(e)
      }
    })
    return new Promise( ( resolve, reject ) => {
      const timeout = setTimeout( () => reject( "Failed to setup listener for OCPP Service for 60s, exiting" ), 60000 )
      const [ key, cert ] = [ readFileSync(this.#ocppConnector.tls.keyPath, "utf-8" ), readFileSync(this.#ocppConnector.tls.certPath, "utf-8" ) ]
      const httpsServer = https.createServer({
        cert, key,
        minVersion        : "TLSv1.2",
        rejectUnauthorized: true,
        enableTrace       : true
      })
      httpsServer.listen( this.#ocppConnector.wsport, async () => {
        if ( this.#networkDatabase.status.connected ){
          console.log( "creating" )
          await this.#networkDatabase.createOCPPService({
            cert,
            serviceUUID: this.id,
            hostname: this.#ocppConnector.hostname,
            wsport: this.#ocppConnector.wsport
          })
        }
        clearTimeout( timeout )
        resolve()
      })
      httpsServer.on( 'error', ( err ) => console.log( "error", err ) );
      httpsServer.on( 'upgrade', this.#server.handleUpgrade )
    })
  }
}
export default OCPPService