import { getFilesFromDataTransferItems } from 'datatransfer-files-promise';

const checkWebExtension = (name) => {
  // AutoScrape directory files will always have an extension
  // TODO: handle other HTML-like non-.html extensions (e.g., .php)
  if (name.endsWith(".html") || name.endsWith(".css")) {
    return true;
  }
  return false;
};

const readFiles = (files) => {
  const promises = [];
  for (let i = 0; i < files.length; ++i) {
    const file = files[i];
    if (!checkWebExtension(file.name))
      continue;

    const p = new Promise((res, rej) => {
      // file.filepath is an artifact of getFilesFromDataTransferItems
      const filepath = file.filepath || file.name;
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

    promises.push(p);
  }
  return Promise.all(promises);
};

export const fromDirectoryDrop = (event) => {
  const items = event.dataTransfer.items;
  return getFilesFromDataTransferItems(items)
    .then(files => {
      return readFiles(files);
    });
};

export const fromDirectorySelect = (event) => {
  return readFiles(event.target.files);
};

export const fromZipSelect = (event) => {
  return new Promise((res, rej) => {
    rej("ZIP loader not implemented");
  });
};
