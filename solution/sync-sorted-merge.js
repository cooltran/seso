"use strict";

const Heap = require('heap');

// Function to merge logs from sources and print
function mergeLogs(logSources, printer) {
  const minHeap = new Heap((a, b) => a.date - b.date);
  //Pop the first entry from each source and insert it into the heap
  const sourceIterators = logSources.map(source => {
    const entry = source.pop();
    if (entry) {
      minHeap.push({ ...entry, source });
    }
    return source;
  });

  //Extract the smallest entry from the heap, process it, and pop the next entry from the same source
  while (minHeap.size() > 0) {
    const { source, ...entry } = minHeap.pop();
    printer.print(entry);

    const nextEntry = source.pop();
    if (nextEntry) {
      minHeap.push({ ...nextEntry, source });
    }
  }

  printer.done();
}

module.exports = (logSources, printer) => {
  mergeLogs(logSources, printer);
  return console.log("Sync sort complete.");
};
