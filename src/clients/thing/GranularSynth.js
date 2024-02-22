class GranularSynth {
  constructor(audioContext) {
    this.audioContext = audioContext;

    // time interval between each grain
    this.period = 0.025;
    
    // duration of each grain
    this.duration = 0.1;
    // position of the grain in the buffer
    // this.position = 0;
    this.jittFactor = 0.002; // 0.002 works fine

    this.envBuffer = new Float32Array([0, 1, 0]);

    this.frequency = 200;
    this.detune = 0;
    this.type = 'sine';
     
    // create an output gain on wich will connect all our grains
    this.output = this.audioContext.createGain();
    // bind the render method so that we don't loose the instance context
    this.render = this.render.bind(this);

  }

  render(currentTime) {
    const jitter = Math.random() * this.jittFactor; 
    const grainTime = currentTime + jitter; 
    // create our evenvelop gain
    const env = this.audioContext.createGain();
    // connect it to output
    env.connect(this.output);
    
    // schedule the fadein and fadeout
    env.gain.value = 0;
    // env.gain.setValueAtTime(0, grainTime); 
    env.gain.setValueCurveAtTime(this.envBuffer, grainTime, this.duration);
    // env.gain.linearRampToValueAtTime(1, grainTime + this.duration / 2); 
    // env.gain.linearRampToValueAtTime(0, grainTime + this.duration);    
    
    const osc = this.audioContext.createOscillator();
    osc.type = this.type; // defaut = "sine" can be "sine", "square", "sawtooth", "triangle" and "custom"
    // this.osc.frequency.value = 100 ; // valeur en hertz
    osc.detune.value = this.detune;
    osc.frequency.value = this.frequency;
    osc.connect(env);
    osc.start(grainTime);
    osc.stop(grainTime + this.duration);

    // ask to be called at time of next grain
    return currentTime + this.period;
  }
}

export default GranularSynth;
