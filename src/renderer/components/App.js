// @flow
import React, { Component } from 'react';

import styled from "styled-components"
import { createGlobalStyle, css } from "styled-components";
import modernNormalize from "styled-modern-normalize";

import {Menu, Options} from './Menu'

const ModernNormalize = createGlobalStyle`
  ${modernNormalize}

  body {
    position: relative;
    color: white;
    height: 100vh;
    background-color: #232c39;
    //background-image: linear-gradient(45deg, rgba(0, 216, 255, 0.5) 10%, rgba(0, 1, 127, 0.7));
    font-family: Arial, Helvetica, Helvetica Neue, serif;
    overflow-y: hidden;

    margin: 0;
  }

  h2 {
    margin: 0;
    font-size: 2.25rem;
    font-weight: bold;
    letter-spacing: -0.025em;
    color: #fff;
  }

  font-family: 'Roboto', Arial, Helvetica, Helvetica Neue, sans-serif;
  font-size: 23px;

  color: #333;
`;


const Page = styled.div`
  position: absolute;
  height: 100%;
  width: 100%;

  height: 100%;
  background-color: #1a73e8;
  display: flex;
  flex-direction: column;

  > h2 {
    text-align: center;
  }
`

const TextCard = styled.div`
  margin: 16px;

  display: flex;
  flex-direction: column;
  flex-grow:1;

  > label {
    padding-left: 1px;
    padding-bottom: 8px;
  }

  textarea {
    box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.16), 0px 3px 6px rgba(0, 0, 0, 0.23);
    border-radius: 3px;
    flex-grow: 1;

    overflow: auto;
    // Some specificity was preventing this as global style? (chrome useragent stylesheet)
    font-family: 'Roboto', Arial, Helvetica, Helvetica Neue, sans-serif;
    font-size: 23px;
    color: #333;

    border: none;
    padding: 16px;
    resize: none;

    :focus {
      outline: none;//!important;
    }
  }

  > input {
    width: 100px;
  }
`



const example_240 = "Hello, how are you today? I'm awesome, I've had a fantastic day! Really? That is quite something isn't? Have you heard about the invention expo next month? It's full of creative innovators, I can't wait to go and see what everyone has made!"

import moize from 'moize'

import requestAudio from '../utils/gvoice_request'
const getAudio = moize({maxSize: 50})(requestAudio)

import WavConverter from '../utils/wavconverter'
import audioUtils from '../utils/webaudio_utils'

import _ from 'lodash' // used for debounce

const stitchAudio = async (urls) => {
  console.log(urls)
  console.log(`Downloaded ${urls.length} files`);

  const buffers = await audioUtils.fetchAudio(urls)
  return audioUtils.concatAudio(buffers)
};


// urls to mp3 audio chunks to download then concatenate
// No need to cache via memoization , http requests are cached?,
// caching the operations(concat(15ms, single file no actual concat) or export(25ms)?) seem to shave off 40ms

// was using {, isDeepEqual: true} here due to array input(and reference comparison), but now that getAudio() is memoized too, it's non-issue
const createAudioBuffer =  moize({maxSize: 5})(async (urls) => {
  // console.log("createAudioBuffer...")
  // TODO: should audio clips be stiched for playback or only during save?
  // playback could benefit in that not all clips are required immediately to play
  return await stitchAudio(urls)
})

// TODO: not require this context?
const context = new AudioContext();
let blob
let source;


// TODO: extract to separate files and utilities,
// Crunker probably not needed(create util methods in local file instead), also not a fan of
// the export method creating new ObjectURL each time but no revoking?
class TextToSpeech extends React.Component {
  constructor(props) {
    super(props);

    this.audioData = null,
    this.audioText = '',

    this.state = {
      value: '',//example_240,
      status_playing: false
    };

    this.handleChange = this.handleChange.bind(this);
    //this.handleSubmit = this.handleSubmit.bind(this);
    this.playAudio = this.playAudio.bind(this);
    this.downloadAudio = this.downloadAudio.bind(this);
    this.updateAudio = this.updateAudio.bind(this)

    this.debouncedFunction =_.debounce(this.updateAudio, 2000);
  }

  handleChange(event) {
    // setState is async/batched, provide a callback instead of calling
    // the method after setState()
    this.setState(
      {value: event.target.value},
      this.debouncedFunction
    );
  }

  // TODO: add some visual status / spinner when performing this action?
  async updateAudio() {
    // reset state, avoids issues with playAudio for example
    this.audioData = null
    this.audioText = this.state.value
    if(this.state.value == '') { console.log("empty, not requesting audio"); return }
    // TODO: This doesn't actually fetch audio data, it gets the URLs that createAudioBuffer fetches.. move that functionality
    const audioData = await getAudio(this.state.value)//, speed)
    this.audioData = audioData;
    console.log("updated audioFiles")
  }

  // click again should toggle playback and button glyph/text?
  async playAudio(event) {
    if (this.audioText != this.state.value) { await this.updateAudio() }
    if (this.audioData == null) { console.log("invalid, not playing audio"); return }
    // console.log("trying to play")
    if (!this.state.status_playing) {
      // console.log("getting audio")
      let audioBuffer = await createAudioBuffer(this.audioData)
      // console.log("received audio")

      source = context.createBufferSource()
      source.buffer = audioBuffer;
      source.connect(context.destination);
      source.onended = (event) => {
        this.setState({status_playing: false});
      }
      source.start();
      // source = audioBuffer.play()
      this.setState({status_playing: true});
    } else {
      // console.log("pausing")
      source.stop();
      this.setState({status_playing: false});
    }
  }

  async downloadAudio(event) {
    let audioBuffer = await createAudioBuffer(this.audioData)
    // memoize?
    const blob = await audioUtils.exportAudio(audioBuffer)
    const name = "recording"
    const ext = "wav"//blob.type.split("/")[1]
    const filename = `${name}.${ext}`;

    let saveData = (function() {
      let a = document.createElement("a");
      document.body.appendChild(a);
      a.style = "display: none";

      return function(blob, fileName) {
        let url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
        console.log("DOWNLOADED: " + fileName)
      };
    }());

    saveData(blob, filename);
  }

  render() {
    const FooterProps = {
      playbackActive: this.state.status_playing,
      onClick: {
        playAudio: this.playAudio,
        downloadAudio: this.downloadAudio
      }
    }

    // TODO: is label appropriate element or even useful element now?
    // Later swap the input element for div based react-component for better UX(eg only colour the progress)
    return (
      <Page>
        <ModernNormalize/>
        <h2>Read it Aloud</h2>
        <TextCard>
          <label>
            Enter text to speak here:
          </label>
          <textarea value={this.state.value} onChange={this.handleChange} />
        </TextCard>

        <Menu {...FooterProps}/>
        {/* // TODO: support several settings, such as a speed slider
        <Options>
          <input type="range" min="0" max="1" defaultValue="0.5" step="any" />
        </Options>
        */}

      </Page>
    );
  }
}

const FullHeight = styled.div`
  position: absolute;
  height: 100%;
  width: 100%;
`

export default class App extends Component {

  render() {
    return (
      <TextToSpeech/>
    );
  }
}
