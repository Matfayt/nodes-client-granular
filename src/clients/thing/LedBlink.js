import GranularSynth from './GranularSynth.js';
// import ws281x from 'rpi-ws281x-native';

class LedBlink {
	constructor(audioContext) {
		this.audioContext = audioContext;
		// this.granular = granular;
		// this.period = granular.period;
		async function bootstrap() {
			const { default: ws281x } = await import('rpi-ws281x-native');
			// const ws2821x = require('rpi-ws281x-native');
			const strip_size = 3;
			const colour_change_period_default = 10; // milliseconds

			const channel = ws281x(strip_size, {
			dma: 10,
			freq: 800000,
			gpio: 12,
			invert: false,
			brightness: 255,
			stripType: ws281x.stripType.WS2812,
			});

			// // use channel 1 for PWM1 on GPIO13 PIN33
			// const channel = ws281x.init({
			//   dma: 10,
			//   freq: 800000,
			//   channels: [
			//     {count: 0, gpio: 10 },
			//     {count: strip_size, gpio: 13, invert: false, brightness: 255, stripType: 'ws2812'},
			//   ]
			// })[0];

			const colorsArray = channel.array;
		}
	}
	render(currentTime) {

      function rgb_to_colour(r, g, b) {
        return (((r << 8) + g) << 8) + b;
        console.log(r);
      }
      // console.log(rgb_to_colour(1, 50, 255));

      function colour_fill(colour) {
        for (let c = 0; c < channel.count; c++) {
          colorsArray[c] = colour;
        }
      }

      function rgb_fill(r, g, b) {
        colour_fill(rgb_to_colour(r, g, b));
      }

      async function rgb_fill_and_render(r, g, b, wait = colour_change_period_default) {
        rgb_fill(r, g, b);
        ws281x.render();
        return await new Promise( (resolve) => setTimeout(resolve, wait));
      }

      async function clear() {
        console.log('clear');
        await rgb_fill_and_render(0, 0, 0);
        ws281x.render();
      }

      ['SIGINT', 'SIGTERM', 'SIGHUP'].forEach( (signal) => {
        process.on(signal, async () => {
          console.log('signal', signal);
          await clear();
          process.exit();
        });
      });
    return currentTime;  

	}
}

export default LedBlink;