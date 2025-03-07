"use strict"

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