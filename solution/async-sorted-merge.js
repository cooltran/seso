"use strict";

const Heap = require('heap');

// Function to merge logs from sources and print
async function mergeLogsAsync(logSources, batchSize, printer) {
  const minHeap = new Heap((a, b) => a.date - b.date);

  // Function to fetch the next batch of entries from a log source
  const fetchBatch = (source, batchSize) => {
    const entries = [];
    for (var i = 0; i < batchSize; i++) {
        const entry = source.popAsync();
        entries.push(entry);
    }
    return entries;
  };

   // Initialize the priority queue with the first batch from each log source
  await Promise.all(logSources.map(async (source) => {
    const entries = await Promise.all(fetchBatch(source, batchSize));
    entries.forEach(entry => {
      if (entry) {
        minHeap.push({ ...entry, source });
      }
    });
  }));

  // Extract the smallest batch entries from the heap, process them, 
  // and pop the next batch entries from sources asynchronously
  while (minHeap.size() > 0) {
    for (var i = 0; i < batchSize; i++) {
      const { source, ...entry } = minHeap.pop();
      printer.print(entry);
    }
    
    const drainedLogSources = new Set();
    // Fetch the next batch of entries from the same log source
    await Promise.all(logSources.map(async (source) => {
      const nextEntries = await Promise.all(fetchBatch(source, batchSize));
      nextEntries.forEach(nextEntry => {
        if (nextEntry) {
          minHeap.push({ ...nextEntry, source });
        } else {
          const index = logSources.indexOf(source);
          drainedLogSources.add(index);
        }
      });
    }));

    drainedLogSources.forEach(index => {
      logSources.splice(index, 1); // Remove the drained log source
    })
  }

  printer.done();
}

// Print all entries, across all of the *async* sources, in chronological order.
module.exports = (logSources, batchSize, printer) => {
  return new Promise((resolve, reject) => {
    (async () => {
      await mergeLogsAsync(logSources, batchSize, printer);
      resolve(console.log("Async sort complete."));
    })();
  });
};

