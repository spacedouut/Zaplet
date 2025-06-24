import { alloc, free } from "./memory";

const MAX_PROCESSES = 1024;
let next_pid = 0;
let processes: Array<Process | null> = new Array<Process | null>(MAX_PROCESSES);

export enum ProcessState {
    Ready,
    Running,
    Stopped,
    Terminated
}

export class Process {
    pid: i32;
    ptr: i32;
    size: i32;
    state: ProcessState;
    entry: i32;
  
    constructor(pid: i32, ptr: i32, size: i32, entry: i32) {
      this.pid = pid;
      this.ptr = ptr;
      this.size = size;
      this.state = ProcessState.Ready;
      this.entry = entry;
    }
}

export function spawn_process(size: i32, entry: i32): i32 {
    let ptr = alloc(size);
    let pid = next_pid;
    next_pid++;
    processes[pid] = new Process(pid, ptr, size, entry);
    trace("spawned process " + pid.toString());
    return pid;
}

export function kill_process(pid: i32): void {
    let process = processes[pid];
    if (process == null) {
        trace("process " + pid.toString() + " does not exist");
        return;
    }
    processes[pid] = null;
    free(process.ptr, process.size);
    trace("killed process " + pid.toString());
    return;
}

export function get_process(pid: i32): Process | null {
    return processes[pid];
}
