import { thingsPresetsDefault } from './setup-default.js';


export const schema = {
  audioLookAhead: {
    type: 'float',
    default: 1, // in seconds
  },

  audioOutputTypes: {
    type: 'any',
    default: [
      'any',// uncomment if you want to control them all
      'DAEX', // transducer
      'T10', // speaker
      'CRS', // small speaker
      'Go2', // J-B Godet
      'Flip3', // J-B Godet
      'Minirig', // J-B Godet
      'JB',
    ],
  },

  // in seconds
  audioOutputTypeLatency: {
    type: 'any',
    default: {
      DAEX: 0,
      T10: 0,
      CRS: 0,
      MegaBoom3: 0.250,
      Go2: 0.,
      Flip3: 0.,
      Minirig: 0.,
      JB: 0.,

    },
  },

  positionLimits: {
    type: 'any',
    default: {
      x: { min: -4, max: 11 },
      y: { min: -4, max: 12 },
    },
  },

  things: {
    type: 'any',
    default: {
      ...thingsPresetsDefault,
    },

  }, // things

};

export const name = 'setup';
