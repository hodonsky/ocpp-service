"use strict"

import neo4j from "neo4j-driver"
import Database from "./Database"

import { TNetworkDatabase } from "./types"

export class NetworkDatabase extends Database implements TNetworkDatabase {
  #credentials : {
    username: string
    password: string
  }
  #link        : any
  #isConnected : boolean

  constructor( options ){
    super( options.configuration )
    this.#credentials = { ...options.credentials }
    this.configuration = { ...options.configuration }
  }
  async connect():Promise<void>{
    const { protocol, hostname, port } = this.configuration
    if ( !protocol || !hostname || !port ) {
      throw new Error(`Not enough info, missing protocol, hostname, or port. ${this.configuration}`)
    }
    const { username, password } = this.#credentials
    console.log( "credentials: ", username, password )
    this.#link = neo4j.driver(
                  `${protocol}://${hostname}:${port}`,
                  neo4j.auth.basic( username,password )
                )
    this.status = { connected: true };
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
  async createChargerRelationshipWithService( { sessionId, serialNumber, hostname } ):Promise<void>{
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

export default NetworkDatabase