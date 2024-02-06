import '@soundworks/helpers/polyfills.js';
import { Server } from '@soundworks/core/server.js';

import { loadConfig } from '../utils/load-config.js';
import '../utils/catch-unhandled-errors.js';

// import the schema of our thing client
import thingSchema from './schemas/thing.js'; 
// import global schema
import globalSchema from './schemas/global.js'; 

// import pluginSync from '@soundworks/plugin-sync/server.js'; 
// import pluginCheckin from '@soundworks/plugin-checkin/server.js'; 

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

const config = loadConfig(process.env.ENV, import.meta.url);

console.log(`
--------------------------------------------------------
- launching "${config.app.name}" in "${process.env.ENV || 'default'}" environment
- [pid: ${process.pid}]
--------------------------------------------------------
`);

/**
 * Create the soundworks server
 */
const server = new Server(config);
// configure the server for usage within this application template
server.useDefaultApplicationTemplate();
// register the global schema 
server.stateManager.registerSchema('global', globalSchema);
// register the schema into the state manager
server.stateManager.registerSchema('thing', thingSchema);
/*
//register plugin
server.pluginManager.register('sync', pluginSync); 
server.pluginManager.register('checkin', pluginCheckin); 
*/

/**
 * Launch application (init plugins, http server, etc.)
 */
await server.start();
// create the shared global state instance 
const global = await server.stateManager.create('global'); 
console.log(global.getValues());



// and do your own stuff!
