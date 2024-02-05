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
    max: 0.1,
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
};
