import { alloc, dumpMap, free } from "./memory";
import { spawn_process } from "./process";

export function test_memory(): void {
    trace("== initial heap state ==");
    dumpMap();
  
    // Allocate 1024 bytes
    let ptr = alloc(1024);
    trace("== allocated 1024 bytes ==");
    trace("pointer:");
    trace(ptr.toString());
  
    // Store a value
    let value: u32 = 123456;
    trace("== storing value ==");
    trace("value:");
    trace(value.toString());
    store<u32>(ptr, value);
  
    // Load it back
    let loaded = load<u32>(ptr);
    trace("== reading value ==");
    trace("read:");
    trace(loaded.toString());
    assert(loaded == value);
  
    // Dump heap after alloc
    trace("== heap after alloc ==");
    dumpMap();
  
    // Free memory
    free(ptr, 1024);
    trace("== freed 1024 bytes ==");
  
    // Final heap state
    trace("== final heap state ==");
    dumpMap();
}

export function test_process(): void {
    let pid = spawn_process(1024, 0);
    assert(pid != -1);
    kill_process(pid);
}