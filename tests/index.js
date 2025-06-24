import assert from "assert";



import fs from "fs";
import loader from '@assemblyscript/loader';

class Tests {
    constructor() {
        this.wasmImports = {
            env: {
                "console.log": (msg) => console.log("wasm console.log:", msg),
                abort: () => { throw new Error("wasm abort"); }
            }
        };
    }
    MemoryTest() {
        const buffer = fs.readFileSync("/Users/asherriggins/Documents/Projects/Zaplet/build/debug.wasm");
        const kernelModule = loader.instantiateSync(buffer, this.wasmImports);
        
        console.log(kernelModule.exports);
        kernelModule.exports.test_memory();
    }
}

console.log("ok")
console.log("running memory test")

let tests = new Tests();
tests.MemoryTest();
