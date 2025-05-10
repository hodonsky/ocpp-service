"use strict"

import { constants, verify } from "crypto"

// 1. BootNotification.req
export const BootNotification = (client, { params }) => {
  console.log(`Server got BootNotification from ${client.identity}:`, params);
  return {
    status: "Accepted",             // or "Pending"/"Rejected"
    interval: 300,                  // heartbeat interval in seconds
    currentTime: new Date().toISOString()
  };
};

// 2. Authorize.req
export const Authorize = (client, { params }) => {
  console.log(`Server got Authorize from ${client.identity}:`, params);
  return {
    idTagInfo: {
      status: "Accepted",           // or "Blocked"/"Expired"/etc.
      expiryDate: null,             // ISO 8601 date or null
      parentIdTag: null
    }
  };
};

// 3. StartTransaction.req
export const StartTransaction = (client, { params }) => {
  console.log(`Server got StartTransaction from ${client.identity}:`, params);
  const transactionId = Math.floor(Math.random() * 1e6);
  return {
    transactionId,
    idTagInfo: {
      status: "Accepted",
      expiryDate: null,
      parentIdTag: null
    }
  };
};

// 4. StopTransaction.req
export const StopTransaction = (client, { params }) => {
  console.log(`Server got StopTransaction from ${client.identity}:`, params);
  return {
    idTagInfo: {
      status: "Accepted",
      expiryDate: null,
      parentIdTag: null
    }
  };
};

// 5. Heartbeat.req
export const Heartbeat = (client, { params }) => {
  console.log(`Server got Heartbeat from ${client.identity}:`, params);
  return {
    currentTime: new Date().toISOString()
  };
};

// 6. StatusNotification.req
export const StatusNotification = (client, { params }) => {
  console.log(`Server got StatusNotification from ${client.identity}:`, params);
  return {};
};

// 7. MeterValues.req
export const MeterValues = (client, { params }) => {
  console.log(`Server got MeterValues from ${client.identity}:`, params);
  return {};
};

// 8. DataTransfer.req
export const DataTransfer = (client, { params }) => {
  console.log(`Server got DataTransfer from ${client.identity}:`, params);
  return {
    status: "Accepted",            // or "Rejected"/"UnknownMessageId"
    data: null                     // optional response payload
  };
};

// 9. FirmwareStatusNotification.req
export const FirmwareStatusNotification = (client, { params }) => {
  console.log(`Server got FirmwareStatusNotification from ${client.identity}:`, params);
  return {};
};

// 10. DiagnosticsStatusNotification.req
export const DiagnosticsStatusNotification = (client, { params }) => {
  console.log(`Server got DiagnosticsStatusNotification from ${client.identity}:`, params);
  return {};
};

// 11. LogStatusNotification.req
export const LogStatusNotification = (client, { params }) => {
  console.log(`Server got LogStatusNotification from ${client.identity}:`, params);
  return {};
};

// /**
//  * Mirror of the charger’s call to check an RFID token.
//  */
// export const Authorize = (client, { params }) => {
//   console.log(`Server got Authorize from ${client.identity}:`, params);
//   return {
//     idTagInfo: {
//       status: "Accepted",           // or "Blocked" / "Expired" / etc.
//       expiryDate: null,             // ISO datetime, or null
//       parentIdTag: null             // for local authorization chaining
//     }
//   };
// };

// /**
//  * Charger notifies start of a transaction (car plugged in, meter start).
//  */
// export const StartTransaction = (client, { params }) => {
//   console.log(`Server got StartTransaction from ${client.identity}:`, params);
//   // generate a simple transactionId for demo
//   const transactionId = Math.floor(Math.random() * 1e6);
//   return {
//     transactionId,
//     idTagInfo: {
//       status: "Accepted",
//       expiryDate: null,
//       parentIdTag: null
//     }
//   };
// };

// /**
//  * Charger notifies end of a transaction (car unplugged, meter end).
//  */
// export const StopTransaction = (client, { params }) => {
//   console.log(`Server got StopTransaction from ${client.identity}:`, params);
//   return {
//     idTagInfo: {
//       status: "Accepted",
//       expiryDate: null,
//       parentIdTag: null
//     }
//   };
// };

// /**
//  * Periodic (or on-demand) meter readings during an active transaction.
//  */
// export const MeterValues = (client, { params }) => {
//   console.log(`Server got MeterValues from ${client.identity}:`, params);
//   // params will include meterValue array of sample points
//   return {};  // no payload required
// };

// /**
//  * Vendor-specific or custom data exchange.
//  */
// export const DataTransfer = (client, { params }) => {
//   console.log(`Server got DataTransfer from ${client.identity}:`, params);
//   return {
//     status: "Accepted",  // or "Rejected"/"UnknownMessageId"
//     data: null           // optional response payload
//   };
// };

// /**
//  * Notifies server of the progress of a firmware upload.
//  */
// export const FirmwareStatusNotification = (client, { params }) => {
//   console.log(`Server got FirmwareStatusNotification from ${client.identity}:`, params);
//   return {};  // no payload
// };

// /**
//  * Notifies server of the progress of a diagnostics upload.
//  */
// export const DiagnosticsStatusNotification = (client, { params }) => {
//   console.log(`Server got DiagnosticsStatusNotification from ${client.identity}:`, params);
//   return {};  // no payload
// };