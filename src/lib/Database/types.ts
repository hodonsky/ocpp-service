"use strict"

import {
  INetworkDatabase,
  IEventsDatabase
} from "./interfaces"

export type TDatabase = {
  connect()    : Promise<void>
  get status() :{ connected: boolean }
  set status({ connected }:{ connected:boolean })
}

export type TNetworkDatabase = TDatabase & INetworkDatabase
export type TEventsDatabase = TDatabase & IEventsDatabase