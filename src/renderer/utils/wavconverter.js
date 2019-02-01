export default class WavConverter {
  static convert(buffer) {
    const AudioBuffer = buffer.getChannelData(0)
    const SampleRate = buffer.sampleRate

    return this._writeHeaders(AudioBuffer, SampleRate);
  }

  static _writeHeaders(buffer, sampleRate) {
    const channels = 1
    const bytesPerSample = 2 // 16 bits / 8
    const dataSize = buffer.length * channels * bytesPerSample

    const headerSize = 44
    const arrayBuffer = new ArrayBuffer(headerSize + dataSize)
    const view = new DataView(arrayBuffer);

    // Wave Format Header: http://soundfile.sapp.org/doc/WaveFormat/
    this._writeString(view, 0, "RIFF");
    view.setUint32(4, 32 + dataSize, true);
    this._writeString(view, 8, "WAVE");
    // Subchunk 1 "fmt"
    this._writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true); // How many bytes after for this subchunk
    view.setUint16(20, 1, true); // AudioFormat PCM == 1
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * bytesPerSample, true);
    view.setUint16(32, channels * bytesPerSample, true);
    view.setUint16(34, 16, true); // 16-bits per sample
    // Subchunk 2 "data"
    this._writeString(view, 36, "data");
    view.setUint32(40, dataSize, true);
    // Actual audio data follows after (convert Float32 to PCM16)

    return this._floatTo16BitPCM(view, buffer, 44);
  }

  static _writeString(dataview, offset, header) {
    let output;
    for (var i = 0; i < header.length; i++) {
      dataview.setUint8(offset + i, header.charCodeAt(i));
    }
  }

  static _floatTo16BitPCM(dataview, buffer, offset) {
    for (var i = 0; i < buffer.length; i++, offset += 2) {
      let tmp = Math.max(-1, Math.min(1, buffer[i]));
      dataview.setInt16(offset, tmp < 0 ? tmp * 0x8000 : tmp * 0x7fff, true);
    }
    return dataview;
  }
}
