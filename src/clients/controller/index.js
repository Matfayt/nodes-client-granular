import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import launcher from '@soundworks/helpers/launcher.js';

import { html, render } from 'lit';
import '../components/sw-audit.js';
// import pluginSync from '@soundworks/plugin-sync/client.js';

import '@ircam/sc-components/sc-button.js';
import '@ircam/sc-components/sc-text.js'; 
import '@ircam/sc-components/sc-slider.js'; 
import '@ircam/sc-components/sc-toggle.js';
import '@ircam/sc-components/sc-dial.js';
import '@ircam/sc-components/sc-radio.js';
import '@ircam/sc-components/sc-number.js';
import '@ircam/sc-components/sc-tab.js';
import thing from '../../server/schemas/thing.js';


// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

const config = window.SOUNDWORKS_CONFIG;

// client.pluginManager.register('sync', pluginSync);
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

  const setupState = await client.stateManager.attach('setup');


  function getThingStatesSelection(audioOutputType) {
    const selection = thingCollection.filter( (thingState) => {
      return audioOutputType === 'any'
        || thingState.get('audioOutputType') === audioOutputType;
    });
    const selectionSorted = selection.sort((a, b) => {
      return a.get('hostname') > b.get('hostname');
    });
    return selectionSorted;
  }

  function renderThing(thing) {


    return html`  
          <div style="padding-bottom: 4px">
            <sc-text>HostN: ${thing.get('hostname')}</sc-text> 
            <sc-text>Type:${thing.get('audioOutputType')}</sc-text>
            </div>
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
            <sc-text>trigger frequency</sc-text> 
            <sc-number
              value=${1/thing.get('period')}
              readonly=true
            ></sc-number>
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
            <sc-tab
            options="${JSON.stringify(['sine', 'triangle', 'sawtooth', 'square'])}"
            .value=${thing.get('oscType')}
            @change=${e => thing.set({oscType: e.detail.value})}
            ></sc-tab>
          </div>
            `; 
  }

  function controlThings(things) {
    return html`  
          <div style="padding-bottom: 4px"> 
            <sc-text>Start Synth</sc-text> 
            <sc-toggle 
              @change=${e => things.forEach(thing => thing.set({ startSynth: e.detail.value }))} 
            ></sc-toggle> 
          </div>
          <div style="padding-bottom: 4px"> 
            <sc-text>period</sc-text> 
            <sc-slider 
              min=0.005
              max=0.9
              @input=${e => things.forEach(thing => thing.set({ period: e.detail.value }))} 
              number-box
            ></sc-slider>
          </div>
          <div style="padding-bottom: 4px"> 
            <sc-text>duration</sc-text> 
            <sc-slider 
              min=0.01
              max=0.5
              @input=${e => things.forEach(thing => thing.set({ duration: e.detail.value }))}  
              number-box
            ></sc-slider> 
          </div>
          <div style="padding-bottom: 4px"> 
            <sc-text>oscFrequency</sc-text> 
            <sc-slider 
              step = 1
              min=1 
              max=15000
              @input=${e => things.forEach(thing => thing.set({ oscFreq: e.detail.value }))} 
              number-box
            ></sc-slider> 
          </div>
          <div>
            <sc-tab
              options="${JSON.stringify(['sine', 'triangle', 'sawtooth', 'square'])}"
              @change=${e => things.forEach(thing => thing.set({oscType: e.detail.value}))}
            ></sc-tab>
          </div>
              `; 
  }

  function renderApp() {
    render(html`
      <div class="controller-layout">
        <header>
          <h1>${client.config.app.name} | ${client.role}</h1>
            <sw-audit .client="${client}"></sw-audit>
        </header>
        <section>
          <h2>Global</h2> 
          <h3>Volume</h3>
          <div style="padding-bottom: 4px"> 
            <sc-text>Master</sc-text> 
            <sc-slider 
              min=${global.getSchema('master').min} 
              max=${global.getSchema('master').max} 
              value=${global.get('master')} 
              @input=${e => global.set({ master: e.detail.value })} 
            ></sc-slider> 
          </div> 
          <div style="padding-bottom: 4px"> 
            <sc-text>Mute</sc-text> 
            <sc-toggle 
              ?active=${global.get('mute')} 
              @change=${e => global.set({ mute: e.detail.value })} 
            ></sc-toggle> 
          </div>
          <h3>Feedback Delay</h3>
          <div style="padding-bottom: 4px"> 
          <div>
            <sc-text>preGain</sc-text>
            <sc-slider
            min=${global.getSchema('preGain').min} 
            max=${global.getSchema('preGain').max} 
            value=${global.get('preGain')} 
            @input=${e => global.set({ preGain: e.detail.value })} 
            ></sc-slider>
          </div>
          <div>
            <sc-text>feedback</sc-text>
            <sc-slider
            min=${global.getSchema('feedback').min} 
            max=${global.getSchema('feedback').max} 
            value=${global.get('feedback')} 
            @input=${e => global.set({ feedback: e.detail.value })} 
            ></sc-slider>
          </div>
          <div>
            <sc-text>delayTime</sc-text>
            <sc-slider
            min=${global.getSchema('delayTime').min} 
            max=${global.getSchema('delayTime').max} 
            value=${global.get('delayTime')} 
            @input=${e => global.set({ delayTime: e.detail.value })} 
            ></sc-slider>
          </div>
        </section> 
        <section>
          <h2>Types</h2> 

          ${setupState.get("audioOutputTypes").map( (type) => {
            return html`
            <h3>Type: ${type}</h3>
            ${controlThings(getThingStatesSelection(type))}
            `;

          })}
        </section>

        <section>
          <h2>Players</h2> 
            ${getThingStatesSelection('any').map(thing => renderThing(thing) )} 
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
