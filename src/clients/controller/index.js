import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import launcher from '@soundworks/helpers/launcher.js';

import { html, render } from 'lit';
import '../components/sw-audit.js';

import '@ircam/sc-components/sc-button.js';
import '@ircam/sc-components/sc-text.js'; 
import '@ircam/sc-components/sc-slider.js'; 
import '@ircam/sc-components/sc-toggle.js';
import '@ircam/sc-components/sc-dial.js';
import '@ircam/sc-components/sc-radio.js';


// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

const config = window.SOUNDWORKS_CONFIG;


async function main($container) {
  const client = new Client(config);

  launcher.register(client, {
    initScreensContainer: $container,
    reloadOnVisibilityChange: false,
  });

  await client.start();

  // create the collection and update the GUI on every collection event
  const thingCollection = await client.stateManager.getCollection('thing'); 
  const global = await client.stateManager.attach('global');
  thingCollection.onUpdate(() => renderApp()); 
  thingCollection.onAttach(() => renderApp()); 
  thingCollection.onDetach(() => renderApp());

  function renderApp() {
    render(html`
      <div class="controller-layout">
        <header>
        
          <h1>${client.config.app.name} | ${client.role}</h1>
            <sw-audit .client="${client}"></sw-audit>
        </header>
        <section>
          <h2>Global</h2> 
          <div style="padding-bottom: 4px"> 
            <sc-text>ir select</sc-text> 
            <sc-radio 
              options="${JSON.stringify(['Chapel', 'Cave'])}"
              value=${global.get('ir')} 
              @change=${e => global.set({ ir: e.detail.value })} 
            ></sc-radio> 
          </div>
          <div style="padding-bottom: 4px"> 
            <sc-text>dry</sc-text> 
            <sc-slider 
              min=${global.getSchema('master').min} 
              max=${global.getSchema('master').max} 
              value=${global.get('master')} 
              @input=${e => global.set({ master: e.detail.value })} 
            ></sc-slider> 
          </div> 
          <div style="padding-bottom: 4px"> 
            <sc-text>wet</sc-text> 
            <sc-slider 
              min=${global.getSchema('reverb').min} 
              max=${global.getSchema('reverb').max} 
              value=${global.get('reverb')} 
              @input=${e => global.set({ reverb: e.detail.value })} 
            ></sc-slider> 
          </div>
          <div style="padding-bottom: 4px"> 
            <sc-text>mute</sc-text> 
            <sc-toggle 
              ?active=${global.get('mute')} 
              @change=${e => global.set({ mute: e.detail.value })} 
            ></sc-toggle> 
          </div>
        </section>  
        <section>
          <h2>Players</h2> 
            ${thingCollection.map(thing => { 
              return html`  
          <div style="padding-bottom: 4px"> 
            <sc-text>Start Synth</sc-text> 
            <sc-toggle 
              ?active=${thing.get('startSynth')} 
              @change=${e => thing.set({ startSynth: e.detail.value })} 
            ></sc-toggle> 
          </div>
          <div style="padding-bottom: 4px"> 
            <sc-text>period</sc-text> 
            <sc-slider 
              min=${thing.getSchema('period').min} 
              max=${thing.getSchema('period').max} 
              value=${thing.get('period')} 
              @input=${e => thing.set({ period: e.detail.value })} 
              number-box
            ></sc-slider> 
          </div>
          <div style="padding-bottom: 4px"> 
            <sc-text>duration</sc-text> 
            <sc-slider 
              min=${thing.getSchema('duration').min} 
              max=${thing.getSchema('duration').max} 
              value=${thing.get('duration')} 
              @input=${e => thing.set({ duration: e.detail.value })} 
              number-box
            ></sc-slider> 
          </div>
          </div>
          <div style="padding-bottom: 4px"> 
            <sc-text>oscFrequency</sc-text> 
            <sc-slider 
              step = 1
              min=${thing.getSchema('oscFreq').min} 
              max=${thing.getSchema('oscFreq').max} 
              value=${thing.get('oscFreq')} 
              @input=${e => thing.set({ oscFreq: e.detail.value })} 
              number-box
            ></sc-slider> 
          </div>
          <div> 
            <sc-button 
              @input=${e => thing.set({ oscTypeSin: true })} 

            >Sin (default)</sc-button> 
                
          
            <sc-button 
              @input=${e => thing.set({ oscTypeTri: true })} 
            >Tri</sc-button> 
          
          
            <sc-button 
              @input=${e => thing.set({ oscTypeSaw: true })} 
            >Saw</sc-button> 
          
          
            <sc-button 
              @input=${e => thing.set({ oscTypeSqr: true })} 
            >Sqr</sc-button> 
          </div>    
          
            `; 
          })}
        </section>
      </div>
    `, $container);
  }

  global.onUpdate(() => {
     
    console.log(`Volume ${global.get('master')}`);
    console.log(`Mute ${global.get('mute')}`);
  renderApp();}, true);
}

launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate')) || 1,
  width: '50%',
});
