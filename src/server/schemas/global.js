export default { 
    master: { 
      type: 'float', 
      default: 1, 
      min: 0, 
      max: 1, 
    }, 
    reverb: { 
      type: 'float', 
      default: 1, 
      min: 0, 
      max: 1, 
    },
    ir: { 
      type: 'string', 
      default: 'chapel', 
    },
    mute: { 
      type: 'boolean', 
      default: false, 
    }, 
    preGain: {
      type: 'float', 
      default: 0, 
      min: 0, 
      max: 1, 
    },
    feedback: {
      type: 'float', 
      default: 0, 
      min: 0, 
      max: 1, 
    },
    delayTime: {
      type: 'float', 
      default: 0, 
      min: 0, 
      max: 1, 
    },
    granularType: {
      type: 'string',
      default: 'oscillator', 
    },
  };