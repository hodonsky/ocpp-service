"use strict"

import { Client as ESClient } from '@elastic/elasticsearch';

import Database from "./Database"

import { TEventsDatabase } from "./types"
import {
  IDatabaseConfiguration,
  IEventsDatabaseConfiguration
} from "./interfaces"

export class EventsDatabase extends Database implements TEventsDatabase {
  #link
  #esIndex

  constructor(configuration: IDatabaseConfiguration & IEventsDatabaseConfiguration ){
    super( configuration )
    this.#esIndex = configuration.index
    this.#link = new ESClient({
                  node: `${this.configuration.protocol}://${this.configuration.hostname}:${this.configuration.port}`,
                  auth: configuration.auth,
                  tls : configuration.tls
                 })
    this.connect()
  }
  async connect(): Promise<void> {
    const exists = await this.#link.indices.exists({ index: this.#esIndex })
    if ( !exists ) {
      await this.#link.indices.create({
        index: this.#esIndex,
        body: {
          mappings: {
            properties: {
              timestamp: { type: 'date'    },
              source   : { type: 'keyword' },
              target   : { type: 'keyword' },
              event    : { type: 'nested'  }
            },
          },
        },
      });
      console.log( "ESIndex Complete" )
    }
    return Promise.resolve()
  }
  async logEvent( source:string, target:string, event: any ): Promise<void>{
    return this.#link.index({
      index: this.#esIndex,
      body : {
        timestamp: new Date().getTime(),
        source, target, event
      }
    });
  }
  async getLogs( involved ){
    return await this.#link.search({
      index: this.#esIndex,
      body: {
        query: { bool: {
            must: [
              { bool: {
                  should: [
                    { term: { source: involved } }, // ✅ Matches source
                    { term: { target: involved } }  // ✅ Matches target
                  ],
                  minimum_should_match: 1           // Ensures at least one condition is met
              } },
              { range: { timestamp: { gte: 'now-7d/d' } } } // ⏳ Time filtering after
            ]
        } },
        sort: [{ timestamp: { order: 'desc' } }],
        stored_fields: [ "timestamp", "source", "target", "data"],
      },
    });
  }
}

export default EventsDatabase