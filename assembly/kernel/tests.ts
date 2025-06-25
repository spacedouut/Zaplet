import { alloc_kernel, alloc_user, dumpMap, free_kernel, free_user, dumpMap as dumpHeapMap} from "./memory";
import { spawn_process } from "./process";

export function test_kernel_memory(): void {
    trace("== initial kernel heap state ==");
    dumpMap(0);
  
    // Allocate 1024 bytes
    let ptr = alloc_kernel(1024);
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
    trace("== kernel heap after alloc ==");
    dumpMap(0);
  
    // Free memory
    free_kernel(ptr, 1024);
    trace("== freed 1024 bytes ==");
  
    // Final heap state
    trace("== final kernel heap state ==");
    dumpMap(0);
}

export function test_process(): void {
    let pid = spawn_process(1024, 0);
    assert(pid != -1);
    kill_process(pid);
}