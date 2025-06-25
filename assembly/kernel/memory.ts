// The HEAP_SIZE should be in bytes for the StaticArray constructor.
// 16 MB = 16 * 1024 * 1024 bytes.

// Kernel Heap is 16MB. Everything else is userspace.
// 128MB (total memory by default set in the asconfi) - 16MB (kernel heap) = 112MB (userspace)

const MAP_BLOCK_SIZE: i32 = 4;

const MEMORY_TOTAL: i32 = 128 * 1024 * 1024; // Zaplet has a default of ~128MB of memory (02 2048 Pages)

const KERNEL_HEAP_SIZE: i32 = 16 * 1024 * 1024;
const KERNEL_MAP_SIZE: i32 = KERNEL_HEAP_SIZE / MAP_BLOCK_SIZE;
const kernelHeap = new StaticArray<u8>(KERNEL_HEAP_SIZE);
const kernelHeapMap = new Uint8Array(KERNEL_MAP_SIZE); // 0 = free, 1 = used

const USER_HEAP_SIZE: i32 = MEMORY_TOTAL - KERNEL_HEAP_SIZE; // Should be 112MB
const USER_MAP_SIZE: i32 = USER_HEAP_SIZE / MAP_BLOCK_SIZE;
const userHeap = new StaticArray<u8>(USER_HEAP_SIZE);
const userHeapMap = new Uint8Array(USER_MAP_SIZE); // 0 = free, 1 = used


const userProcessMap = new Map<i32, i32>();

function alignTo(value: i32, alignment: i32): i32 {
  return ((value + alignment - 1) / alignment) * alignment;
}

/**
 * Allocates a block of memory of a given size.
 * This is a "first-fit" allocator. It searches for the first available block.
 */
export function alloc_kernel(size: i32): i32 {
  // We must align the size to our block size for the map to work correctly.
  const alignedSize = alignTo(size, 4); // 8-byte alignment
  const requiredBlocks = alignedSize / MAP_BLOCK_SIZE;

  let free_blocks_found = 0;
  let start_block_index = -1;

  // Search the heapMap for a contiguous block of free space
  for (let i = 0; i < KERNEL_MAP_SIZE; i++) {
    if (kernelHeapMap[i] == 0) {
      // If the block is free
      if (start_block_index == -1) {
        start_block_index = i; // Mark the beginning of a potential free space
      }
      free_blocks_found++;
      if (free_blocks_found >= requiredBlocks) {
        // We found a large enough block!
        const ptr = start_block_index * MAP_BLOCK_SIZE;

        // Mark the blocks as used in the map
        for (let j = 0; j < requiredBlocks; j++) {
          kernelHeapMap[start_block_index + j] = 1;
        }

        // Return the pointer to the start of the allocated memory
        return ptr;
      }
    } else {
      // If the block is used, reset our search
      free_blocks_found = 0;
      start_block_index = -1;
    }
  }

  // If we get here, no block of the required size was found.
  // Using 'unreachable()' is a common Wasm pattern for "panic".
  // Or you could return 0 to signify a null pointer.
  unreachable(); // Out of memory
  return 0;
}

export function alloc_user(size: i32, pid: i32): i32 {
  // We must align the size to our block size for the map to work correctly.
  const alignedSize = alignTo(size, 4); // 8-byte alignment
  const requiredBlocks = alignedSize / MAP_BLOCK_SIZE;

  let free_blocks_found = 0;
  let start_block_index = -1;

  // Search the heapMap for a contiguous block of free space
  for (let i = 0; i < USER_MAP_SIZE; i++) {
    if (userHeapMap[i] == 0) {
      // If the block is free
      if (start_block_index == -1) {
        start_block_index = i; // Mark the beginning of a potential free space
      }
      free_blocks_found++;
      if (free_blocks_found >= requiredBlocks) {
        // We found a large enough block!
        const ptr = start_block_index * MAP_BLOCK_SIZE;

        // Mark the blocks as used in the map
        for (let j = 0; j < requiredBlocks; j++) {
          userHeapMap[start_block_index + j] = 1;
          userProcessMap.set(start_block_index + j, pid);
        }

        // Return the pointer to the start of the allocated memory
        return ptr;
      }
    } else {
      // If the block is used, reset our search
      free_blocks_found = 0;
      start_block_index = -1;
    }
  }

  // If we get here, no block of the required size was found.
  // Using 'unreachable()' is a common Wasm pattern for "panic".
  // Or you could return 0 to signify a null pointer.
  unreachable(); // Out of memory
  return 0; start_block_index
}

/**
 * Frees a previously allocated block of memory.
 */
export function free_kernel(ptr: i32, size: i32): void {
  // sanity check: can we even free there?
  if (ptr > KERNEL_HEAP_SIZE || ptr < 0) {
    trace("invalid kernel-space free: " + ptr.toString());
    return;
  }
  const startBlock = ptr / MAP_BLOCK_SIZE;
  const blocksToFree = (size + MAP_BLOCK_SIZE - 1) / MAP_BLOCK_SIZE;

  // Mark all blocks for this memory region as free (0)
  for (let i = 0; i < blocksToFree; i++) {
    kernelHeapMap[startBlock + i] = 0;
  }
  return;
}

export function free_user(ptr: i32, size: i32): void {
  // sanity check: can we even free there?
  if (ptr < KERNEL_HEAP_SIZE || ptr >= MEMORY_TOTAL) {
    trace("invalid user-space free: " + ptr.toString());
    return;
  }

  const startBlock = ptr / MAP_BLOCK_SIZE;
  const blocksToFree = (size + MAP_BLOCK_SIZE - 1) / MAP_BLOCK_SIZE;

  // Mark all blocks for this memory region as free (0)
  for (let i = 0; i < blocksToFree; i++) {
    userHeapMap[startBlock + i] = 0;
    userHeap[startBlock + i] = 0;
    userProcessMap.delete(startBlock + i);
  }
  return;
}

export function read_user(ptr: i32, pid: i32): u8 {
    if (userProcessMap.has(pid)) {
        return load<u8>(ptr);
    }
    return 0;
}

// Dumps the entire heapMap to the console. Good for debugging.
export function dumpMap(heap: i32): void {
  switch (heap) {
    case 0:
      var heapMap = kernelHeapMap;
      break;
    case 1:
      var heapMap = userHeapMap;
      break;
    default:
      trace("invalid heap: " + heap.toString());
      return;
  }
  var str = "";
  for (let i = 0; i < 100; i++) {
    str += heapMap[i].toString() + " ";
  }

  trace(str);
  return;
}
