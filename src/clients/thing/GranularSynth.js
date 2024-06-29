class GranularSynth {
  constructor(audioContext, soundBuffer) {
    this.audioContext = audioContext;

    //Engine type selection
    this.engineType = 'oscillator'; 

    //Grain parameters
    // time interval between each grain
    this.period = 0.025;
    // duration of each grain
    this.duration = 0.1;
    // position
    this.positionFactor = 0.1; // a factor (O. - 1.) for the buffer length
    //jitter
    this.periodJittFactor = 0.002; // 0.002 works fine
    this.positionJitter = 0.1;

    //Envelope buffer
    this.envBuffer = new Float32Array([0, 1, 0]);

    //Sound Buffer
    this.soundBuffer = soundBuffer;
    this.playback = 1.0; // Playback rate aka sample rate (1 is 44100, 0.5 is 22050 etc...)

    //Oscillator parameters
    this.frequency = 200;//In Hz 
    this.detune = 0; //in cents
    this.type = 'sine'; // defaut = "sine" can be "sine", "square", "sawtooth", "triangle" and "custom"
    
    // Set distortion amount to control waveshaper
    this.distortionAmount = 0;

    // this.energy = 0;

    // create an output gain on wich will connect all our grains
    this.output = this.audioContext.createGain();
    // bind the render method so that we don't loose the instance context
    this.render = this.render.bind(this);
  }

  render(currentTime) {
    const periodJitter = Math.random() * this.periodJittFactor; 
    const grainTime = currentTime + periodJitter;
    // const position = (this.soundBuffer.duration * this.positionFactor); // DEBUG without any Jitter
    // console.log(this.energy)
    //analyser node ?
    

    // Position for buffer and its jitter
    // The idea is to choose a random value btween position - jitterAmount and position + jitterAmount, but never go below 0 or above 1 to always hear sound  
    
    const minPosFactor = this.positionFactor - this.positionJitter; 
    // in case < 0, set 0 to read an actual buffer index
    function getMinFactor (factor) {
      if (factor < 0) {
        factor = 0;
      } else{
        factor = factor;
      }
      return factor;
    }

    // in case > 1, set to 1 to read an actual buffer index
    const maxPosFactor = this.positionFactor + this.positionJitter;  
    function getMaxFactor (factor) {
      if (factor > 1) {
        factor = 1;
      } else{
        factor = factor;
      }
      return factor;
    }
    const min = getMinFactor(minPosFactor);
    const max = getMaxFactor(maxPosFactor);
    
    function getJitterPosFactor(min, max) {
      return Math.random() * (max - min) + min;
    }

    const jitterPosFactor = getJitterPosFactor(min, max); //get a random position value
    const position = (this.soundBuffer.duration * jitterPosFactor); // set the actual buffer postion 

    // ENVELOPE 
    const env = this.audioContext.createGain();

    // connect it to output
    env.connect(this.output);
    // env.connect(this.analyserNode);

    // schedule the fadein and fadeout
    env.gain.value = 0;
    env.gain.setValueAtTime(0, grainTime); //Make sure set 0 at the end of envelope
    env.gain.setValueCurveAtTime(this.envBuffer, grainTime, this.duration);

    //DISTORTION NODE (copy/paste from mdn)
    const distortion = this.audioContext.createWaveShaper();
    function makeDistortionCurve(amount) {
      const k = typeof amount === "number" ? amount : 50;
      const n_samples = 44100;
      const curve = new Float32Array(n_samples);
      const deg = Math.PI / 180;

      for (let i = 0; i < n_samples; i++) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
      return curve;
    }

    distortion.curve = makeDistortionCurve(this.distortionAmount);
    //distortion.oversample = "4x"; //crashing engine
    distortion.connect(env);

    //OSCILLATOR VS BUFFER
    if (this.engineType === 'oscillator') {
      // console.log('engineType=oscillator');
      const osc = this.audioContext.createOscillator();
      osc.type = this.type; // defaut = "sine" can be "sine", "square", "sawtooth", "triangle" and "custom"
      // this.osc.frequency.value = 100 ; // valeur en hertz

      osc.detune.value = this.detune;
      osc.frequency.value = this.frequency;
      // osc.connect(env);
      osc.connect(distortion);
      osc.start(grainTime);
      osc.stop(grainTime + this.duration);

    } else if (this.engineType === 'buffer') {
      // console.log('engineType=buffer');
      const src = this.audioContext.createBufferSource();
      src.buffer = this.soundBuffer;
      src.detune.value = this.detune;
      src.playbackRate.value = this.playback;
      src.connect(distortion);
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
