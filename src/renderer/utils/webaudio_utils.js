import * as Promise from 'bluebird';

// Sample rate default varies based on OS/output device sampleRate
// Support for configuring that is slim presently, only offline context supports it
const _audioContext = new window.AudioContext()
const _sampleRate = _audioContext.sampleRate//44100
const _totalLength = (buffers) => {
  return buffers
    .map(buffer => buffer.length)
    .reduce((a, b) => a + b, 0);
}

const fetchAudio = async (filepaths) => {
  const files = filepaths.map(async filepath => {

    try {
      const buffer = await fetch(filepath).then(response => {
        if (!response.ok) {
          throw new Error('Something went wrong');
          // response.status response.statusText
        }

        return response.arrayBuffer()
      })
      
      return await _audioContext.decodeAudioData(buffer);
    } catch (error) {
      console.error(error)
      // Actually handle the error here
    }
  });

  return await Promise.all(files);
}

const concatAudio = (buffers) => {
  const output = _audioContext.createBuffer(
    1,
    _totalLength(buffers),
    _sampleRate
  )
  let offset = 0;
  buffers.forEach(buffer => {
    output.getChannelData(0).set(buffer.getChannelData(0), offset);
    offset += buffer.length;
  });

  return output;
}

const resample = async (input_buffer, target_rate) => {
  const len = input_buffer.length
  const src_rate = input_buffer.sampleRate
  // New sampleRate requires adjusted buffer length to retain duration
  // length is seconds * sampleRate
  const target_len = len * (target_rate / src_rate)

  // Until better support for `AudioContext({sampleRate}),
  // use `OfflineAudioContext` which supports setting the sampleRate
  const c = new OfflineAudioContext(
    1,
    target_len,
    target_rate
  );

  // Copy the`AudioContext` buffer so `OfflineAudioContext` can use it
  const b = c.createBuffer(
    1,
    len,
    src_rate
  );
  b.copyToChannel(input_buffer.getChannelData(0), 0);

  // Setup the audio graph to render (input buffer resampled into output buffer)
  const s = c.createBufferSource();
  s.buffer = b;
  s.connect(c.destination);
  s.start();

  return await c.startRendering()
}

import WavConverter from '../utils/wavconverter'
const exportAudio = async (buffer, audioType) => {
    const type = audioType || "audio/wav";
    const buf = await resample(buffer, 24000)
    const ArrayBuffer = WavConverter.convert(buf)
    // const ArrayBuffer = buf.getChannelData(0)
    return new Blob([ArrayBuffer])//, { type: type });
}

const audioUtils = {fetchAudio, concatAudio, exportAudio}

export default audioUtils
