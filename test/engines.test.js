import test from 'node:test';
import assert from 'node:assert/strict';
import { runReplacement, parseReference } from '../src/engines/replacement.js';
import { createMemoryState, createProcess, translateAddress } from '../src/engines/osEngine.js';
const reference = parseReference('7,0,1,2,0,3,0,4,2,3,0,3,2');
test('known replacement reference produces verified fault counts', () => { assert.equal(runReplacement(reference, 3, 'FIFO').faults, 10); assert.equal(runReplacement(reference, 3, 'LRU').faults, 9); assert.equal(runReplacement(reference, 3, 'Optimal').faults, 7); });
test('address translation loads a nonresident page and calculates physical address', () => { let state = createProcess(createMemoryState(3), 'Editor', 4); const result = translateAddress(state, 'P1', 2050, 'FIFO', []); assert.equal(result.page, 2); assert.equal(result.offset, 2); assert.equal(result.frame, 0); assert.equal(result.physicalAddress, 2); assert.equal(result.event.type, 'PAGE_FAULT'); });
