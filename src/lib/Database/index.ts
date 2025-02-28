"use strict"

import neo4j from "neo4j-driver"
import Base from "../Base"

export class Database extends Base {// extends Base implements TDatabase {
  #credentials : {
    username  : string
    passphrase: string
  }
  #link        : any
  #isConnected : boolean
  configuration: {
    protocol: string
    host    : string
    port    : string
  }

  constructor( options ){
    super()
    this.#credentials = {
      username  : options.credentials.username,
      passphrase: options.credentials.passphrase
    }
    this.configuration = {
      protocol: options.configuration.protocol,
      host    : options.configuration.host,
      port    : options.configuration.port
    }
  }
  async connect():Promise<void>{
    const { protocol, host, port } = this.configuration
    this.#link = neo4j.driver(
                  `${protocol}://${host}:${port}`,
                  neo4j.auth.basic( 
                    this.#credentials.username,
                    this.#credentials.passphrase
                  )
                )
    this.#isConnected = true;
  }
  get status() {
    return {
      connected: this.#isConnected
    }
  }
  async #query( query:string, options? ):Promise<void>{
    const session = this.#link.session()
    try {
      return await session.run( query, options )
    } catch ( e ) {
      console.error( e )
    } finally {
      return await session.close()
    }
  }
  async createChargerRelationshipWithService( { sessionId, serialNumber, hostname } ){
    const createdDate = new Date().getTime(), updatedDate = createdDate
    await this.#query(`
      MATCH (o:ocppService {hostname: $hostname}), (e:evse { serialNumber: $serialNumber })
      MERGE (o)<-[r:CONNECTED_TO]-(e)
      ON CREATE SET r.sessionId = $sessionId, r.createdDate = $createdDate, r.updatedDate = $updatedDate
      RETURN o, e;`,
      { sessionId, serialNumber, hostname, createdDate, updatedDate }
    )
  }
  async destroyChargerRelationshipWithService({ hostname, sessionId, serialNumber }){
    await this.#query(`
      MATCH (o:ocppService {hostname: $hostname})<-[r:CONNECTED_TO {sessionId: $sessionId}]-(e:evse {serialNumber: $serialNumber}) DELETE r`,
      {hostname, sessionId, serialNumber }
    )
  }
  async createOCPPService({ cert, serviceUUID, hostname }){
    const now = new Date().getTime()
    await this.#query(`
      MERGE (o:ocppService {hostname:$hostname})
      ON CREATE SET   o.uuid = $serviceUUID,
                      o.createdDate = $createdDate,
                      o.updatedDate = $updatedDate,
                      o.cert = $cert
      ON MATCH SET    o.updatedDate = $updatedDate,
                      o.cert = $cert;`,
      { cert, serviceUUID, hostname, createdDate: now, updatedDate: now }
    )
  }
  async destroyOCPPService( serviceUUID ){
    await this.#query(`
      MATCH (o:ocppService {uuid:$serviceUUID})
      DETACH DELETE o `,
      { serviceUUID }
    )
  }
}

export default Database