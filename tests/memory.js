import fs from "fs";
import loader from '@assemblyscript/loader';

const imports = {
  env: {
    "console.log": (msg) => console.log("wasm console.log:", msg),
    abort: () => { throw new Error("wasm abort"); }
  }
};

const buffer = fs.readFileSync("/Users/asherriggins/Documents/Projects/Zaplet/build/debug.wasm");
const kernelModule = loader.instantiateSync(buffer, imports);

console.log(kernelModule.exports);
kernelModule.exports.test_memory();
