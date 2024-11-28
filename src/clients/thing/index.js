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
import {thingsPresetsDefault} from '../../server/schemas/setup-default.js';
import {schema}  from '../../server/schemas/setup.js';

import { config as ledConfig } from './led.js';

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

  //LEDS///////
  const ledClient = null
  // const ledClient = process.env.EMULATE !== undefined
  //   ? null
  //   : new Client({ role: 'dotpi-led-client', ...ledConfig });


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
  console.log('client started');
  // LEDS create
  let rgb = null;

  if (ledClient) {
    await ledClient.start();
    rgb = await ledClient.stateManager.create('rgb');
  }

  // attach to the global state
  const global = await client.stateManager.attach('global');
  console.log(global.getValues());

  const { id } = client;
  const hostname = process.env.EMULATE ? 'emulated' : os.hostname();
  console.log(hostname);

  // create the thing state and initialize it's id field
  const thing = await client.stateManager.create('thing', {
    id,
    hostname,
  });

  // register audioContext
  const audioContext = new AudioContext();
  // const numChannels = 32;

  // audioContext.destination.channelCount = numChannels;
  // audioContext.destination.channelInterpretation = 'discrete';

  // MAIN AUDIO BUS /////////////////
  // from merger to ...
  // const merger = audioContext.createChannelMerger(32);
  // merger.channelInterpretation = 'discrete';
  // merger.connect(audioContext.destination);

  // //from master to ...
  const master = audioContext.createGain();
  master.gain.value = global.get('master');

  // MULTIPLE OUTPUT
  // master.connect(merger, 0, id % 32); //for multichannel output (32 max)
  // audioContext.maxChannelCount = 2;

  // SIMPLE OUTPUT
  master.connect(audioContext.destination) // for simple output

  //from volume to ...
  const volume = audioContext.createGain();
  volume.gain.value = thing.get('volume');
  volume.connect(master);

  //from delay to ...
  const delay = new FeedbackDelay(audioContext, {});
  delay.output.connect(volume);

  //from mute to ...
  const mute = audioContext.createGain();
  mute.gain.value = global.get('mute') ? 0 : 1;
  // mute.connect(reverb);
  mute.connect(delay.input);

  // //Analyser Node to get info about outputed sound and optionnally control leds
  // const analyserNode = audioContext.createAnalyser();
  // analyserNode.fftSize = 512;
  // const analyserBufferSize = analyserNode.fftSize
  // // analyserNode.smoothingTimeConstant = 0.2;
  // // const bufferSize = analyserNode.fftSize;

  // const analyserArray = new Float32Array(analyserBufferSize);

  // // LEDS ////////

  // setInterval(() => {
  //   analyserNode.getFloatTimeDomainData(analyserArray);
  //   // Sum squares to get energy and divide to get 0. to 1.
  //   const energy = analyserArray.reduce( (e, v) => e + v * v, 0.) / analyserNode.fftSize;
  //   master.connect(analyserNode);

  //   //Set rgb leds
  //   if (ledClient) {
  //     rgb.set({
  //       r: energy * 3, //255 cause energy from 0. to 1.
  //       g: energy * 234,
  //       b: energy * 0,
  //     });
  //   } else {
  //     // console.log(energy);
  //   }
  // }, 20);

  //Audio Source Buffer
  // Paths
  const soundFiles = [
    'public/assets/river.wav',
    'public/assets/burn.wav',
    'public/assets/clang.wav',
  ];

  // Load the actual buffers
  const loaderAudio = new AudioBufferLoader(audioContext.sampleRate); //evryone at 48000
  const soundBuffer = await loaderAudio.load(soundFiles);

  // Name to index for easy manipulation with interface (thing.get(string))
  const sounds = {
    'river' : soundBuffer[0],
    'burn' : soundBuffer[1],
    'clang' : soundBuffer[2],
  };

  // create a new scheduler, in the audioContext timeline
  const scheduler = new Scheduler(() => audioContext.currentTime);
  // create our granular synth and connect it to audio destination
  const granular = new GranularSynth(audioContext, soundBuffer);
  // Set a default value so it can read one at init
  granular.soundBuffer = soundBuffer[0];
  // Connect it to mute (output)
  granular.output.connect(mute);
  // granular.energy = energy;

  // Envelopes
  const envelopeFiles = [
    'public/assets/env/env.gauss.wav',
    'public/assets/env/env.hanning.wav',
    'public/assets/env/env.tri.wav',
    'public/assets/env/env.trapez.short.wav',
    'public/assets/env/env.trapez.long.wav',
    'public/assets/env/env.blackman.wav',
    'public/assets/env/env.expdec.wav',
    'public/assets/env/env.expmod.wav',
  ];

  // const loader = new AudioBufferLoader({ sampleRate: 48000 }); //same sample rate for everyone
  const envBuffers = await loaderAudio.load(envelopeFiles);

  //Translate to Float32 and manage memory allocation
  const envChannels = envBuffers.map(buffer => {
    const env = new Float32Array(buffer.length);
    buffer.copyFromChannel(env, 0);
    return env;
  });

  //Custom sine envelope
  const waveArraySize = 1000;
  const waveArray = new Float32Array(waveArraySize);
  const phaseIncr = Math.PI / (waveArraySize - 1);
  let phase = 0;
  for (let i = 0; i < waveArraySize; i++) {
    const value = Math.sin(phase);
    waveArray[i] = value;
    phase +=  phaseIncr;
  }

  const envelops = {
    'Gauss': envChannels[0],
    'Hanning': envChannels[1],
    'Tri': envChannels[2],
    'TrapS': envChannels[3],
    'TrapL': envChannels[4],
    'Blackman': envChannels[5],
    'Expdec': envChannels[6],
    'Expmod': envChannels[7],
    'Sine': waveArray,
  };

  // Vicentino microtones in cents
  const vicentino = ["0", "76", "117", "193", "269", "310", "386", "462", "503", "620", "696", "772", "813", "889", "965", "1006", "1082", "1158"];
  // Randomly select a cent value from the list
  function chooseNote() {
    return vicentino[Math.floor(Math.random() * vicentino.length)];
  }

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
            granular.frequency = thing.get('oscFreq');
          } else if (value !== null) {
            //stop the synth
            scheduler.remove(granular.render, audioContext.currentTime);
          }
          break;
        }
        //update values if modifed during synth started
        case 'volume': {
          if (GranularSynth !== null) {
            const now = audioContext.currentTime;
            volume.gain.setTargetAtTime(value, now, 0.02);
          }
          break;
        }
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
        case 'startPosition': {
          if (GranularSynth !== null) {
            granular.positionFactor = thing.get('startPosition');
          }
          break;
        }
        case 'positionJitter': {
          if (GranularSynth !== null) {
            granular.positionJitter = thing.get('positionJitter');
          }
          break;
          }
        case 'playbackRate': {
          if (GranularSynth !== null) {
            granular.playback = thing.get('playbackRate');
          }
          break;
          }
        case 'periodJitter': {
          if (GranularSynth !== null) {
            granular.periodJittFactor = thing.get('periodJitter');
          }
          break;
        }
        case 'oscFreq': {
          if (GranularSynth !== null) {
            granular.frequency = thing.get('oscFreq');
          }
          break;
        }
        case 'distoAmount': {
          if (GranularSynth !== null) {
            granular.distortionAmount = thing.get('distoAmount');
          }
          break;
        }
        case 'changeCent': {
          if (GranularSynth !== null) {
            granular.detune = chooseNote();
          }
          break;
        }
        case 'oscType': {
          granular.type = thing.get('oscType');
          break;
        }
        case 'soundFile': {
          const file = thing.get('soundFile');
          granular.soundBuffer = sounds[file];
          break;
        }
        case 'envelopeType': {
          const type = thing.get('envelopeType');
          granular.envBuffer = envelops[type];
          break;
        }
        case 'granularType': {
          granular.engineType = thing.get('granularType');
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
  }, true);

}

// The launcher allows to fork multiple clients in the same terminal window
// by defining the `EMULATE` env process variable
// e.g. `EMULATE=10 npm run watch-process thing` to run 10 clients side-by-side
launcher.execute(bootstrap, {
  numClients: process.env.EMULATE ? parseInt(process.env.EMULATE) : 1,
  moduleURL: import.meta.url,
});
