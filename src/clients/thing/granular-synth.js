
export class GranularSynth {
    constructor(audioContext, osc) {
      this.audioContext = audioContext;
      this.osc = osc;

      // time interval between each grain
      this.period = 0.025;
      this.frequency = 1 / this.period;
      // duration of each grain
      this.duration = 0.1;
      // position of the grain in the buffer
      // this.position = 0;

      let vicentino = ["0", "76", "117", "193", "269", "310", "386", "462", "503", "620", "696", "772", "813", "889", "965", "1006", "1082", "1158"];

      function chooseNote() {
        return vicentino[Math.floor(Math.random() * vicentino.length)];
      }      
      this.centsValue = chooseNote();
      

      // create Oscillator node
      this.osc = this.audioContext.createOscillator();
      this.osc.type = "sine"; // defaut = "sine" can be "sine", "square", "sawtooth", "triangle" and "custom"
      // this.osc.frequency.value = 100 ; // valeur en hertz
      this.osc.detune.value = this.centsValue ;
      console.log(this.osc.frequency.value);
      console.log(this.osc.type);
      
      // create an output gain on wich will connect all our grains
      this.output = this.audioContext.createGain();
      // bind the render method so that we don't loose the instance context
      this.render = this.render.bind(this);

    }

    render(currentTime) {
  
      console.log(currentTime);
      const jitter = Math.random() * 0.002; 
      const grainTime = currentTime + jitter; 
      // create our evenvelop gain
      const env = this.audioContext.createGain();
      // connect it to output
      env.connect(this.output);
      
      // schedule the fadein and fadeout
      env.gain.value = 0;
      env.gain.setValueAtTime(0, grainTime); 
      env.gain.linearRampToValueAtTime(1, grainTime + this.duration / 2); 
      env.gain.linearRampToValueAtTime(0, grainTime + this.duration); 

      
      
      // custom envelope ?
      // env.gain.setValueCurveAtTime([...], startTime, duration);
      
      this.osc.start();
      this.osc.connect(env);
  
      // ask to be called at time of next grain
      return currentTime + this.period;
    }
  }
  