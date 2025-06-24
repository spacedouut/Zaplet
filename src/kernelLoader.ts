// src/kernelLoader.ts
import { instantiate } from "@assemblyscript/loader";

export async function loadKernel() {
  const response = await fetch("/build/release.wasm");
  const buffer = await response.arrayBuffer();

  const wasmModule = await instantiate(buffer, {
    env: {
      print: (ptr: number) => {
        const memory = wasmModule.exports.memory as WebAssembly.Memory;
        const U8 = new Uint8Array(memory.buffer);

        let str = "";
        for (let i = ptr; U8[i] !== 0; i++) {
          str += String.fromCharCode(U8[i]);
        }
        console.log("[kernel]", str);
      },
      abort: () => console.error("kernel abort")
    }
  });

  return wasmModule.exports;
}
