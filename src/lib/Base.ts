"use strict"

import { EventEmitter } from "events"

const processEmitter = new EventEmitter( { captureRejections: true } )
const signals = [ "SIGINT", "SIGTERM", "SIGUSR2", "exit" ]
signals.forEach( signal => processEmitter.once( signal, () => processEmitter.emit( "processKill", signal ) ) )

export class Base extends EventEmitter {
  constructor(){
    super()
    const signals = [ "SIGINT", "SIGTERM", "SIGUSR2", "exit" ]
    signals.forEach( signal => this.once( signal, () => processEmitter.emit( "processKill", signal ) ) )
  }
}
export default Base
