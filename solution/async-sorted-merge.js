"use strict";

const Heap = require('heap');

// Function to merge logs from sources and print
async function mergeLogsAsync(logSources, printer) {
  const minHeap = new Heap((a, b) => a.date - b.date);
  const sourcePromises = logSources.map(async source => {
    const entry = await source.popAsync();
    if (entry) {
      minHeap.push({ ...entry, source });
    }
    return source;
  });

  // Initialize heap with first entries from all sources
  await Promise.all(sourcePromises);

  // Extract the smallest entry from the heap, process it, 
  // and pop the next entry from the same source asynchronously
  while (minHeap.size() > 0) {
    const { source, ...entry } = minHeap.pop();
    printer.print(entry);
    
    const nextEntry = await source.popAsync();
    if (nextEntry) {
      minHeap.push({ ...nextEntry, source });
    }
  }

  printer.done();
}

// Print all entries, across all of the *async* sources, in chronological order.
module.exports = (logSources, printer) => {
  return new Promise((resolve, reject) => {
    (async () => {
      await mergeLogsAsync(logSources, printer);
      resolve(console.log("Async sort complete."));
    })();
  });
};

