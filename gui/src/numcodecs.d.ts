/* eslint-disable @typescript-eslint/no-explicit-any */

// not sure why it is necessary to include this file
// but if I don't, I get an error when trying nx build neurosift

declare module 'numcodecs' {
    export class Blosc {
        encode(data: any): any
        decode(data: any): any
    }
  }