"use strict"

import { constants, verify } from "crypto"

// create a specific handler for handling BootNotification requests
export const BootNotification = ( client, {params} ) => {
  console.log(`Server got BootNotification from ${client.identity}:`, params);
  return {
      status: "Accepted",
      interval: 30000,
      currentTime: new Date().toISOString()
  };
}

// create a specific handler for handling Heartbeat requests
export const Heartbeat = (client, { params }) => {
  console.log(`Server got Heartbeat from ${client.identity}:`, params);
  return { currentTime: new Date().toISOString() }
}

// create a specific handler for handling StatusNotification requests
export const StatusNotification = ( client, ...args ) => {
  console.log( `Server got StatusNotification from ${client.identity}:`, ...args);
  return {};
}

export const PSK = ( client, { psk } ) => {
  console.log( "Server got an expected PSK", psk )
  const { publicKey, signature, challenge } = JSON.parse(psk.toString());
  console.log( "Public Key: ", publicKey );
  console.log( "Signature: ", signature );
  console.log( "Callenge: ", challenge );

  if ( !verify( "sha265", Buffer.from( challenge ), { key: publicKey, padding: constants.RSA_PKCS1_PSS_PADDING } ) ) {
    throw new Error("Failed PSK exchange")
  }

  return { success: true }
}