import api from 'google-tts-api/lib/api'
import key from 'google-tts-api/lib/key'

// var qs = require('qs');
// const host = 'https://translate.google.com';

import moize from 'moize'
import * as Promise from 'bluebird';
// Might be useful to have another function provide a fresh memoized instance
// so that if the cached key becomes invalid during use, a request error can
// try to refresh the key first and request again (otherwise a restart might be required)
let getTTSKey = moize.simple(async () => {
  return await key()
})
getTTSKey()


const requestAudio = async (input, speed) => {
  // Convert all white-space into `space` type and
  // remove repetitive white-space, just like google officially does
  // Any white-space greater than 2 in size, or any single white-space
  // that isn't a `space`(avoid redundant single space to single space)
  let src_str = input.replace(/[\s+]{2,}|[^\S ]/g, ' ').trim();

  let chunks = [];
  let chunk_start = 0;
  let max_chars = 200;
  let len = src_str.length;

  // for(chunk_start; max_chars < len; chunk_start++) {
  while (max_chars < len) {
    // Take a slice of the source string up to max_chars in size.
    let chunk = src_str.slice(chunk_start, max_chars);

    // Get index of first matching punctuation symbol from the rightside
    let chunk_rev = chunk.split('').reverse().join('');
    let matched_index = chunk_rev.search(/\s[?!.:;,]/g);

    // If no matches, if the last word is incomplete, split at prior space
    if (matched_index == -1) {
      matched_index = 0;

      // Google doesn't check for punctuation symbols, only space
      if (src_str[max_chars] != ' ') {
        consle.log('spacetime!')
        matched_index = chunk_rev.search(' ') // + 1
      }
    }

    const split_at = chunk.length - matched_index;
    const str_chunk = chunk.slice(0, split_at)
    chunks.push(str_chunk);

    chunk_start += split_at;
    max_chars += str_chunk.length;
  }

  // Final chunk
  const final_chunk = src_str.slice(chunk_start, max_chars)
  chunks.push(final_chunk);

  // Get TTS request URLs (Array of strings)
  return await Promise.map(chunks, (chunk, i) => {
    return new Promise(async resolve => {
        const TTS_KEY = await getTTSKey()
        resolve(api(chunk, TTS_KEY))//, lang, speed))
      })
      .then((url) => {
        console.log('Download success');
        return url;
      })

    // return x.resolve()
    // .catch(function (err) {
    //   console.error(err.stack);
    // });
  })

}
 export default requestAudio
