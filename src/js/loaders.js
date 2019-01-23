import { getFilesFromDataTransferItems } from 'datatransfer-files-promise';

const readDataTransferFiles = (files) => {
  const promises = files.map(file => {
    // AutoScrape directory files will always have an extension
    if (!file.name.endsWith(".html") && !file.name.endsWith(".css")) {
      return;
    }
    return new Promise((res, rej) => {
      const filepath = file.filepath;
      const start = 0;
      const stop = file.size - 1;
      const blob = file.slice(start, stop + 1);
      const reader = new FileReader();
      reader.onloadend = (e) => {
        if (e.target.readyState == 2) { // DONE
          res({
            "data": e.target.result,
            "name": filepath,
          });
        }
      };
      reader.readAsText(blob);
    });
  }).filter(x => x);
  return Promise.all(promises);
};

export const fromDirectoryDrop = (event) => {
  const items = event.dataTransfer.items;
  return getFilesFromDataTransferItems(items)
    .then(files => {
      return readDataTransferFiles(files);
    });
};

export const fromDirectorySelect = (event) => {
  return new Promise((res, rej) => {
    rej("Directory (browse) select loader not implemented");
  });
};

export const fromZIPSelect = (event) => {
  return new Promise((res, rej) => {
    rej("ZIP loader not implemented");
  });
};
