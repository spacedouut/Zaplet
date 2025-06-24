// The HEAP_SIZE should be in bytes for the StaticArray constructor.
// 16 MB = 16 * 1024 * 1024 bytes.
const HEAP_SIZE: i32 = 16 * 1024 * 1024;
const kernelHeap = new StaticArray<u8>(HEAP_SIZE);

// Your heapMap is a great idea. Let's use it for searching.
// We use a Uint8Array here to be more space-efficient (1 byte per block instead of 4).
// Let's define that one block in our map represents 4 bytes in the heap.
const MAP_BLOCK_SIZE: i32 = 4;
const MAP_SIZE: i32 = HEAP_SIZE / MAP_BLOCK_SIZE;
const heapMap = new Uint8Array(MAP_SIZE); // 0 = free, 1 = used

const processMap = new Map<i32, i32>();

function alignTo(value: i32, alignment: i32): i32 {
    return ((value + alignment - 1) / alignment) * alignment;
}

/**
 * Allocates a block of memory of a given size.
 * This is a "first-fit" allocator. It searches for the first available block.
 */
export function alloc(size: i32): i32 {
  // We must align the size to our block size for the map to work correctly.
  const alignedSize = alignTo(size, 4); // 8-byte alignment
  const requiredBlocks = alignedSize / MAP_BLOCK_SIZE;
  
  let free_blocks_found = 0;
  let start_block_index = -1;

  // Search the heapMap for a contiguous block of free space
  for (let i = 0; i < MAP_SIZE; i++) {
    if (heapMap[i] == 0) { // If the block is free
      if (start_block_index == -1) {
        start_block_index = i; // Mark the beginning of a potential free space
      }
      free_blocks_found++;
      if (free_blocks_found >= requiredBlocks) {
        // We found a large enough block!
        const ptr = start_block_index * MAP_BLOCK_SIZE;

        // Mark the blocks as used in the map
        for (let j = 0; j < requiredBlocks; j++) {
          heapMap[start_block_index + j] = 1;
        }

        // Return the pointer to the start of the allocated memory
        return ptr;
      }
    } else { // If the block is used, reset our search
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

/**
 * Frees a previously allocated block of memory.
 */
export function free(ptr: i32, size: i32): void {
  const startBlock = ptr / MAP_BLOCK_SIZE;
  const blocksToFree = ((size + MAP_BLOCK_SIZE - 1) / MAP_BLOCK_SIZE);

  // Mark all blocks for this memory region as free (0)
  for (let i = 0; i < blocksToFree; i++) {
    heapMap[startBlock + i] = 0;
  }
}

// Dumps the entire heapMap to the console. Good for debugging.
export function dumpMap(): void {
    var str = "";
    for (let i = 0; i < 100; i++) {
        str += heapMap[i].toString() + " ";
    }
}
  

