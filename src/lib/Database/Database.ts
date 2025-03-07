"use strict"

import Base from "../Base"
import { TDatabase } from "./types"
import { IDatabaseConfiguration } from "./interfaces"

export abstract class Database extends Base implements TDatabase {
  #isConnected              : boolean                = false
  protected configuration   : IDatabaseConfiguration
  constructor( configuration: IDatabaseConfiguration ){
    super()
    this.configuration = configuration
  }
  abstract connect(): Promise<void>
  get status():{ connected:boolean }{
    return { connected: this.#isConnected }
  }
  set status({ connected }:{ connected:boolean }){
    this.#isConnected = connected
  }
}

export default Database