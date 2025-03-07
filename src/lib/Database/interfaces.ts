"use strict"

import { EEventSource, EEventTarget } from "./enums"

export interface IDatabaseConfiguration {
  protocol: string
  hostname: string
  port    : string
}

interface IEventsDatabaseAuth {
  username: string
  password: string
}

interface IEventsDatabaseTLS {
  rejectUnauthorized?: boolean
  ca                ?: string
  cert              ?: string
  key               ?: string
}

export interface IEventsDatabaseConfiguration {
  index: string
  auth?: IEventsDatabaseAuth
  tls ?: IEventsDatabaseTLS
}

export interface INetworkDatabase {
  createChargerRelationshipWithService(payload:{ sessionId:string, serialNumber:string, hostname:string }):Promise<void>
  destroyChargerRelationshipWithService(payload:{ hostname:string, sessionId:string, serialNumber:string }):Promise<void>
  createOCPPService(payload:{ cert:string, serviceUUID:string, hostname:string }):Promise<void>
  destroyOCPPService(serviceUUID:string):Promise<void>
}

export interface IEventsDatabase {
  logEvent( source:string, target:string, payload: any ):Promise<void>
}