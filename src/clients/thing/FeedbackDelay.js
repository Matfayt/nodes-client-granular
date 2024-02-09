class FeedbackDelay {
  constructor(audioContext, options = {}) {

    // console.log('FeedbackDelay created!'); 
    // store the audioContext instance inside the FeedbackDelay instance 
    this.audioContext = audioContext; 
    // prepare logic for handling configuration options 
    this.options = Object.assign({
        preGain: 0.7,
        delayTime: 0.2,
        feedback: 0.8,
    }, options); 

    this.input = this.audioContext.createGain(); 
    this.output = this.audioContext.createGain();

    // feedback loop nodes
    this.preGain = this.audioContext.createGain();
    this.preGain.gain.value = this.options.preGain;
    
    this.delay = this.audioContext.createDelay(1); // "1" is the maximum delay time
    this.delay.delayTime.value = this.options.delayTime;

    this.feedback = this.audioContext.createGain();
    this.feedback.gain.value = this.options.feedback;

    /* Setup connections */
    // direct signal
    this.input.connect(this.output);
    // direct delay line
    this.input.connect(this.preGain);
    this.preGain.connect(this.delay);
    this.delay.connect(this.output);
    // feedback loop
    this.delay.connect(this.feedback);
    this.feedback.connect(this.delay);

  }
  
  setPreGain(value) {
    const timeConstant = 0.01;
    const currentTime = this.audioContext.currentTime;
    this.preGain.gain.setTargetAtTime(value, currentTime, timeConstant);
  }

  setFeedback(value) {
    const timeConstant = 0.01;
    const currentTime = this.audioContext.currentTime;
    this.feedback.gain.setTargetAtTime(value, currentTime, timeConstant);
  }

  setDelayTime(value) {
    const timeConstant = 0.01;
    const currentTime = this.audioContext.currentTime;
    this.delay.delayTime.setTargetAtTime(value, currentTime, timeConstant);
  }      
}
  
export default FeedbackDelay;