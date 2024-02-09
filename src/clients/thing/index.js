import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import launcher from '@soundworks/helpers/launcher.js';
// import { Scheduler } from './scheduler.js';
import { Scheduler } from '@ircam/sc-scheduling'; 
import os from 'node:os';



import { loadConfig } from '../../utils/load-config.js';

// import some classes from the node-web-audio-api package 
import { AudioContext, GainNode, OscillatorNode } from 'node-web-audio-api';
import { AudioBufferLoader } from '@ircam/sc-loader'; 

import GranularSynth from './GranularSynth.js';
import FeedbackDelay from './FeedbackDelay.js';

// import {ConvolutionReverb} from './reverb.js';

// import pluginSync from '@soundworks/plugin-sync/client.js'; 
// import pluginCheckin from '@soundworks/plugin-checkin/client.js'; 




// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

async function bootstrap() {
  /**
   * Load configuration from config files and create the soundworks client
   */
  const config = loadConfig(process.env.ENV, import.meta.url);
  const client = new Client(config);

 /*
  client.pluginManager.register('checkin', pluginCheckin); 
  client.pluginManager.register('sync', pluginSync, { 
    getTimeFunction: () => audioContext.currentTime, 
  });
   */ 
  /**
   * Register some soundworks plugins, you will need to install the plugins
   * before hand (run `npx soundworks` for help)
   */
  // client.pluginManager.register('my-plugin', plugin);

  /**
   * Register the soundworks client into the launcher
   *
   * Automatically restarts the process when the socket closes or when an
   * uncaught error occurs in the program.
   */
  launcher.register(client);


  /**
   * Launch application
   */
  await client.start();
  // attach to the global state 
  const global = await client.stateManager.attach('global'); 

  const { id } = client;
  const hostname = (process.env.EMULATE
    ? 'emulated'
    : os.hostname()
  );
  // create the thing state and initialize it's id field 
  const thing = await client.stateManager.create('thing', {
    id,
    hostname,
  });
  
  // register audioContext
  const audioContext = new AudioContext();
 
  //from master to ...
  const master = audioContext.createGain(); 
  master.gain.value = global.get('master'); 
  master.connect(audioContext.destination); 
  /*

  //impulse response
  async function createReverb() {
    const convolver = audioContext.createConvolver();
  
    // load impulse response from file
    const loader = await new AudioBufferLoader();
    const arraybuffer = await loader.load("public/assets/ir/"+ global.get('ir') + "_IR.wav", audioContext.sampleRate);
    convolver.buffer = await arraybuffer;
    convolver.normalize = true;
  
    return convolver;
  }
  */
  /* BUFFER ENVELOPE 
  async function createEnvelope() {
    const envConvolver = audioContext.createConvolver();
  
    //load impulse response
    const loader = await new AudioBufferLoader();
    const envarraybuffer = await loader.load("public/assets/env/gmu.env.tri.wav", audioContext.sampleRate);

    envConvolver.buffer = await envarraybuffer;
  
    return envConvolver;
  }
  
  const envReverb = await createEnvelope();
  envReverb.connect();
  */
  /*
  //from reverb gain to ...
  const reverbMaster = audioContext.createGain(); 
  reverbMaster.gain.value = global.get('reverb'); 
  reverbMaster.connect(audioContext.destination); 
  */
  /*
  //from reverb ...
  const reverb = await createReverb();
  reverb.connect(reverbMaster); 
  */
  
  //from delay to ...
  const delay = new FeedbackDelay(audioContext, {});
  delay.output.connect(master)


  //from mute to ...
  const mute = audioContext.createGain(); 
  mute.gain.value = global.get('mute') ? 0 : 1; 
  // mute.connect(reverb);
  mute.connect(delay.input);

  //oscilator
  const osc = audioContext.createOscillator();
  // osc.start();

  // create a new scheduler, in the audioContext timeline
  const scheduler = new Scheduler(() => audioContext.currentTime);
  // create our granular synth and connect it to audio destination
  const granular = new GranularSynth(audioContext, osc);
  granular.output.connect(mute);

  // react to updates triggered from controller 
  thing.onUpdate(updates => {
    for (let key in updates) {
      const value = updates[key];
      
      switch (key) {
        case 'startSynth': {
          if (value === true) {
            // register the synth into the scheduler and start it now
            scheduler.add(granular.render, audioContext.currentTime);
            //get and change period and duration 
            granular.period = thing.get('period');
            granular.duration = thing.get('duration');
            granular.frequency = thing.get('triggerFreq');
            // console.log(granular.centsValue);
            granular.osc.frequency.value = thing.get('oscFreq');
          } else if (value !== null) {
            //stop the synth
            scheduler.remove(granular.render, audioContext.currentTime);
          }
        break;
        }
        //update values if modifed during synth started
        case 'period': {
          if (GranularSynth !== null) {
            granular.period = thing.get('period'); 
          }
          break;
        }
        case 'duration': {
          if (GranularSynth !== null) {
            granular.duration = thing.get('duration');
          }
          break;
        }
        case 'oscFreq': {
          if (GranularSynth !== null) {
            granular.osc.frequency.value = thing.get('oscFreq');
        }
        break;
        }
        case 'oscType': {
          granular.osc.type = thing.get('oscType');
        break;
        }
        case 'oscTypeSin' : {
          if (value === true) {
            granular.osc.type = "sine";
          } 
          break;
        }
        case 'oscTypeTri' : {
          if (value === true) {
            granular.osc.type = "triangle";
          } 
          console.log('oscTypeTri: granular.osc.type', granular.osc.type);

          break;
        }
        case 'oscTypeSaw' : {
          if (value === true) {
            granular.osc.type = "sawtooth";
          } 
          break;
        }
        case 'oscTypeSqr' : {
          if (value === true) {
            granular.osc.type = "square";
          } 
          break;
        }
      } 
    }
  }); 
  // UPDATE GLOBAL COMMAND RENDER IN NODE CLIENT LOG (SAME IN CONTROLLER INDEX)

  global.onUpdate(updates => {

    for (let key in updates) {  
      const value = updates[key];  
    
      switch (key) {  
        case 'master': {  
          const now = audioContext.currentTime;  
          master.gain.setTargetAtTime(value, now, 0.02);  
          break;  
        }  
        case 'mute': {  
          const gain = value ? 0 : 1;  
          const now = audioContext.currentTime;  
          mute.gain.setTargetAtTime(gain, now, 0.02);  
          break;  
        }  
        case 'preGain': {   
          const now = audioContext.currentTime;  
          delay.preGain.gain.setTargetAtTime(value, now, 0.02);  
          break;  
        }  
        case 'feedback': {   
          const now = audioContext.currentTime;  
          delay.feedback.gain.setTargetAtTime(value, now, 0.02); 
          break;  
        }  
        case 'delayTime': {   
          const now = audioContext.currentTime;  
          delay.setDelayTime(value, now, 0.02); 
          break;  
        }  

      }  
    } 

    console.log(`Volume ${global.get('master')}`);
    console.log(`Mute ${global.get('mute')}`);
  }, true);
  
}

// The launcher allows to fork multiple clients in the same terminal window
// by defining the `EMULATE` env process variable
// e.g. `EMULATE=10 npm run watch-process thing` to run 10 clients side-by-side
launcher.execute(bootstrap, {
  numClients: process.env.EMULATE ? parseInt(process.env.EMULATE) : 1,
  moduleURL: import.meta.url,
});
