class GranularSynth {
  constructor(audioContext, soundBuffer) {
    this.audioContext = audioContext;

    this.engineType = 'oscillator'; 
    console.log(this.engineType);
    // time interval between each grain
    this.period = 0.025;
    
    // duration of each grain
    this.duration = 0.1;

    this.periodJittFactor = 0.002; // 0.002 works fine

    this.envBuffer = new Float32Array([0, 1, 0]);

    this.soundBuffer = soundBuffer;
    this.positionFactor = 0.1; // a factor (O. - 1.) for the buffer length
    this.positionJitter = 0.1;

    this.frequency = 200;
    this.detune = 0;
    this.type = 'sine';
    this.playback = 1.0;

    

    

    // create an output gain on wich will connect all our grains
    this.output = this.audioContext.createGain();
    // bind the render method so that we don't loose the instance context
    this.render = this.render.bind(this);

  }

  render(currentTime) {
    const periodJitter = Math.random() * this.periodJittFactor; 
    const grainTime = currentTime + periodJitter;
    // const position = (this.soundBuffer.duration * this.positionFactor); // DEBUG without any Jitter

    // Position for buffer and its jitter (which doesn't actually works quite well...)
    const minPosFactor = Math.abs (this.positionFactor - this.positionJitter); // in case < 0, set pos value to read an actual buffer index
    const maxPosFactor = (this.positionFactor + this.positionJitter) % 1; // in case > 1, set value between 0 & 1 "" "" "" "" "" "" "" "" "
    function getJitterPosFactor(min, max) {
      return Math.random() * (max - min) + min;
    }
    const jitterPosFactor = getJitterPosFactor(minPosFactor, maxPosFactor); //get a random position value
    const position = (this.soundBuffer.duration * jitterPosFactor); // set the actual buffer postion 

    // create our evenvelop gain
    const env = this.audioContext.createGain();
    // connect it to output
    env.connect(this.output);
    
    // schedule the fadein and fadeout
    env.gain.value = 0;
    env.gain.setValueAtTime(0, grainTime); //Make sure set 0 at the end of envelope
    env.gain.setValueCurveAtTime(this.envBuffer, grainTime, this.duration);

    if (this.engineType === 'oscillator') {
      // console.log('engineType=oscillator');
      const osc = this.audioContext.createOscillator();
      osc.type = this.type; // defaut = "sine" can be "sine", "square", "sawtooth", "triangle" and "custom"
      // this.osc.frequency.value = 100 ; // valeur en hertz
      osc.detune.value = this.detune;
      osc.frequency.value = this.frequency;
      osc.connect(env);
      osc.start(grainTime);
      osc.stop(grainTime + this.duration);

    } else if (this.engineType === 'buffer') {
      // console.log('engineType=buffer');
      const src = this.audioContext.createBufferSource();
      src.buffer = this.soundBuffer;
      src.detune.value = this.detune;
      src.playbackRate.value = this.playback;
      src.connect(env);
      src.start(grainTime, position);
      src.stop(grainTime + this.duration);
    }

    // DEBUG (handmade simple envelope) /////////////////
    // env.gain.linearRampToValueAtTime(1, grainTime + this.duration / 2); 
    // env.gain.linearRampToValueAtTime(0, grainTime + this.duration);

    // DEBUG (only oscillator) //////////

    // const osc = this.audioContext.createOscillator();
    // osc.type = this.type; // defaut = "sine" can be "sine", "square", "sawtooth", "triangle" and "custom"
    // // this.osc.frequency.value = 100 ; // valeur en hertz
    // osc.detune.value = this.detune;
    // osc.frequency.value = this.frequency;
    // osc.connect(env);
    // osc.start(grainTime);
    // osc.stop(grainTime + this.duration);

    // ask to be called at time of next grain
    return currentTime + this.period;
  }
}

export default GranularSynth;
