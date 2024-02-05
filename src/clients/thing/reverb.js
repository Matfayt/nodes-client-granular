export class ConvolutionReverb {
    constructor () {
        this.audioContext = audioContext;

    async function reverb() {
        this.convolver = this.audioContext.createConvolver();
        this.response = await fetch('../../../public/conv_reverb.wav')
        this.arrayBuffer = await this.response.arrayBuffer();
        this.convolver.buffer = await this.audioContext.decodeAudioData(this.arrayBuffer)

        return this.convolver
    }     
        
    

    }
   
}
