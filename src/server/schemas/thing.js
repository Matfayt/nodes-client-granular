export default {
  id: {
    type: 'integer',
    default: null,
    nullable: true,
  },
  startSynth: {
    type: 'boolean',
    default: false,
  },
  period: {
    type: 'float',
    default: 0.1,
    min: 0.005,
    max: 0.9,
  },
  triggerFreq: {
    type: 'float',
    default: 10,
    min: 0.005,
    max: 10000,
  },
  duration: {
    type: 'float',
    default: 0.1,
    min: 0.01,
    max: 0.5,
  },
  oscFreq: {
    type: 'integer',
    default: 200,
    min: 1,
    max: 15000,
  },
  oscType: {
    type: 'string',
    default: 'sine',
  },
  oscTypeSin: {
    type: 'boolean',
    event: true,
  },
  oscTypeTri: {
    type: 'boolean',
    event: true,
  },
  oscTypeSaw: {
    type: 'boolean',
    event: true,
  },
  oscTypeSqr: {
    type: 'boolean',
    event: true,
  },
  running: {
    type: 'boolean',
    default: false,
  },
  startTime: {
    type: 'float',
    default: null,
    nullable: true,
  },
  BPM: {
    type: 'integer',
    default: 120,
  },
  score: {
    type: 'any',
    default: [],
  },
  hostname: {
    type: 'string',
    default: null,
    nullable: true,
  },

  position: {
    type: 'any',
    default: null,
    nullable: true,
  },

  audioOutputType: {
    type: 'any',
    default: null,
    nullable: true,
  },
};
