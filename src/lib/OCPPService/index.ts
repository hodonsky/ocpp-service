"use strict"

import { randomUUID as uuidv4 }                from "crypto"
import { exec }                                from "child_process"
import { readFileSync, writeFileSync, unlink } from "fs"
import https                                   from "https"

import Base                                    from "../Base"

export class OCPPService extends Base { // implements TOCPPService {
  #database     : any //TDatabase
  #ocppConnector: {
    server  : any
    hostname: string
    port    : string
    ip      : string
    tls     : {
      keyPath    : string
      certPath   : string
      sanConfPath: string
    },
    clientEvents: any
  }

  id            : string | number | symbol       = uuidv4()

  constructor( options ){
    super()
    this.#database = options.database
    this.#ocppConnector = options.ocppConnector

    this.on("processKill", async () => {
      if ( this.#database.status.connected ) {
        await this.#database.destroyOCPPService( this.id )
      }
    })

    this.#setup()
  }
  #setup(){
    if ( !this.#ocppConnector.server ) {
      throw new Error( "No OCPP Connectors available, cannot get connections from chargers")
    }

    this.#ocppConnector.server.auth( async (accept, reject, handshake) => {
      const tlsClient = handshake.request.client
      if (!tlsClient) return reject( 0, "tls Failure" )
      // dblookup, identity(evse_SN, evse_pass->evse_pass_hash)
      const sessionId = uuidv4()
      accept( { sessionId, serialNumber: handshake.identity } )
      //-- setup connection in database
      if ( this.#database.status.connected ){
        await this.#database.addChargerRelationshipToService({
          sessionId,
          serialNumber: handshake.identity,
          hostname    : process.env.HOSTNAME
        })
      }
    })
    this.#ocppConnector.server.on( "client", async ( client ) => {
      this.on( `ChargerCommand:${client.session.serialNumber}`, ( { command, payload } ) => {
        // Authenticate command's author
        // Send event to charger
        console.log( `ChargerCommand:${client.session.serialNumber}`, command, payload )
        client.emit( command, payload )
      })
      //console.log( `${client.session.sessionId} connected!` );
      // Handle client events
      Object.entries( this.#ocppConnector.clientEvents )
            .forEach( ( [ name, fn ]:[ string, any] ) => {
              client.handle( name, (...args) => fn( client, ...args) )
            })

      // create a wildcard handler to handle any RPC method
      client.handle(({method, params}) => {
        console.log( `Server got ${method} from ${client.identity}:`, params);
        throw new Error("Not Implemented");
      });

      client.on( "ping", ( ...args )        => console.log( "Pong", ...args ) )
      client.on( "disconnect", ( ...args )  => console.log( "Disconnect: ", ...args ) )
      client.on( "close", async ( ...args ) => {
        await this.#database.removeChargerRelationshipToService({
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
    if ( this.#database ) {
      await this.#database.connect()
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
      httpsServer.listen( this.#ocppConnector.port, async () => {
        if ( this.#database.status.connected ){
          await this.#database.createOCPPService({ cert: this.#ocppConnector.tls.certPath, id: this.id, hostname: this.#ocppConnector.hostname })
        }
        clearTimeout( timeout )
        resolve()
      })
      httpsServer.on( 'error', ( err ) => console.log( "error", err ) );
      httpsServer.on( 'upgrade', this.#ocppConnector.server.handleUpgrade )
    })
  }
}
export default OCPPService