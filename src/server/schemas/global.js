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
  };