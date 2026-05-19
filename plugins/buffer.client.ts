import { Buffer } from 'buffer';

export default defineNuxtPlugin(() => {
  if (process.client) {
    window.Buffer = Buffer;
    globalThis.Buffer = Buffer;
  }
});
