/* eslint-disable @typescript-eslint/no-explicit-any */
export type ReferenceFileSystemObject = {
  version: any
  refs: {[key: string]: (
    string | [string, number, number]
  )}
  templates?: {[key: string]: string}
}

export class ReferenceFileSystemClient {
  #fileContentCache: {[key: string]: {content: any | undefined, found: boolean}} = {};
  #inProgressReads: {[key: string]: boolean} = {};
  constructor(private obj: ReferenceFileSystemObject) {
  }
  async readJson(path: string): Promise<{[key: string]: any} | undefined> {
    const buf = await this.readBinary(path, {});
    if (!buf) return undefined;
    const text = new TextDecoder().decode(buf);
    // replace NaN by "NaN" so that JSON.parse doesn't choke on it
    // text = text.replace(/NaN/g, '"___NaN___"'); // This is not ideal. See: https://stackoverflow.com/a/15228712
    // BUT we want to make sure we don't replace NaN within quoted strings
    // Here's an example where this matters: https://neurosift.app/?p=/nwb&dandisetId=000409&dandisetVersion=draft&url=https://api.dandiarchive.org/api/assets/54b277ce-2da7-4730-b86b-cfc8dbf9c6fd/download/
    //    raw/intervals/contrast_left
    let newText: string
    if (text.includes('NaN')) {
      newText = '';
      let inString = false;
      let isEscaped = false;
      for (let i = 0; i < text.length; i++) {
          const c = text[i];
          if (c === '"' && !isEscaped) inString = !inString;
          if (!inString && c === 'N' && text.slice(i, i + 3) === 'NaN') {
              newText += '"___NaN___"';
              i += 2;
          } else {
              newText += c;
          }
          isEscaped = c === '\\' && !isEscaped;
      }
    }
    else {
      newText = text;
    }
    try {
      return JSON.parse(newText, (_, value) => {
        if (value === '___NaN___') return NaN;
        return value;
      })
    }
    catch (e) {
      console.warn(text);
      throw Error('Failed to parse JSON for ' + path + ': ' + e);
    }
  }
  async readBinary(path: string, o: {startByte?: number, endByte?: number, disableCache?: boolean}): Promise<ArrayBuffer | undefined> {
    if (o.startByte !== undefined) {
      if (o.endByte === undefined) throw Error('If you specify startByte, you must also specify endByte');
    }
    else if (o.endByte !== undefined) {
      throw Error('If you specify endByte, you must also specify startByte');
    }
    if ((o.endByte !== undefined) && (o.startByte !== undefined) && (o.endByte < o.startByte)) {
      throw Error(`endByte must be greater than or equal to startByte: ${o.startByte} ${o.endByte} for ${path}`);
    }
    if ((o.endByte !== undefined) && (o.startByte !== undefined) && (o.endByte === o.startByte)) {
      return new ArrayBuffer(0);
    }
    const kk = path + '|' + (o.startByte) + '|' + (o.endByte);
    while (this.#inProgressReads[kk]) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    this.#inProgressReads[kk] = true;
    try {
      if (path.startsWith('/')) path = path.slice(1)
      if (this.#fileContentCache[kk]) {
        if (this.#fileContentCache[kk].found) {
          return this.#fileContentCache[kk].content;
        }
        return undefined;
      }
      if (!(path in this.obj.refs)) return undefined;
      const ref = this.obj.refs[path];
      let buf: ArrayBuffer | undefined;
      if (typeof ref === 'string') {
        if (ref.startsWith('base64:')) {
          buf = _base64ToArrayBuffer(ref.slice('base64:'.length));
        }
        else {
          // just a string
          buf = new TextEncoder().encode(ref).buffer;
        }
        if (o.startByte !== undefined) {
          buf = buf.slice(o.startByte, o.endByte);
        }
      }
      else if ((typeof ref === 'object') && (Array.isArray(ref))) {
        if (ref.length !== 3) throw Error(`Invalid ref for ${path}`);
        const refUrl = this._applyTemplates(ref[0]);
        let start = ref[1];
        let numBytes = ref[2];
        if (o.startByte !== undefined) {
          start += o.startByte;
          numBytes = o.endByte! - o.startByte;
        }
        let url0 = refUrl;
        if (o.disableCache) {
          url0 += `?cacheBust=${Date.now()}`;
        }
        const r = await fetch(url0, {
          headers: {
            Range: `bytes=${start}-${start + numBytes - 1}`
          }
        });
        if (!r.ok) throw Error('Failed to fetch ' + refUrl);
        buf = await r.arrayBuffer();
      }
      else if (typeof ref === 'object') {
        buf = new TextEncoder().encode(JSON.stringify(ref)).buffer;
      }
      else {
        throw Error('Invalid ref for ' + path);
      }
      if (buf) {
        this.#fileContentCache[kk] = {content: buf, found: true};
      }
      else {
        this.#fileContentCache[kk] = {content: undefined, found: false};
      }
      return buf;
    }
    catch (e) {
      this.#fileContentCache[kk] = {content: undefined, found: false}; // important to do this so we don't keep trying to read the same file
      throw e;
    }
    finally {
      this.#inProgressReads[kk] = false;
    }
  }
  get _refs() {
    return this.obj.refs;
  }
  _applyTemplates(s: string): string {
    if ((s.includes('{{') && s.includes('}}')) && (this.obj.templates)) {
      for (const [k, v] of Object.entries(this.obj.templates)) {
        s = s.replace('{{' + k + '}}', v);
      }
      return s;
    }
    else {
      return s;
    }
  }
}

function _base64ToArrayBuffer(base64: string) {
  const binary_string = window.atob(base64);
  const bytes = new Uint8Array(binary_string.length);
  for (let i = 0; i < binary_string.length; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

export default ReferenceFileSystemClient;