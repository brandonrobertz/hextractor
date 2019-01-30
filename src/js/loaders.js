import { getFilesFromDataTransferItems } from 'datatransfer-files-promise';

import JSZip from 'jszip';

const TEXT_EXTENSIONS = [
  "\.asp$",
  "\.aspx$",
  "\.axd$",
  "\.asx$",
  "\.asmx$",
  "\.ashx$",
  "\.css$",
  "\.cfm$",
  "\.yaws$",
  "\.html$",
  "\.htm$",
  "\.xhtml$",
  "\.jhtml$",
  "\.hta$",
  "\.jsp$",
  "\.jspx$",
  "\.wss$",
  "\.do$",
  "\.action$",
  "\.pl$",
  "\.php$",
  "\.php4$",
  "\.php3$",
  "\.phtml$",
  "\.rb$",
  "\.rhtml$",
  "\.shtml$",
  "\.xml$",
  "\.rss$",
  "\.svg$",
  "\.cgi$",
  "\.dll$",
  "\.axd$",
  "\.asx$",
  "\.asmx$",
  "\.ashx$",
  "\.aspx$",
  "\.xml$",
  "\.rss$",
  "\.atom$",
]

const checkWebExtension = (name) => {
  // AutoScrape directory files will always have an extension
  // TODO: handle other HTML-like non-.html extensions (e.g., .php)
  const re = RegExp(TEXT_EXTENSIONS.join("|"))
  if (name.match(re)) {
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
  return Promise.all(promises).catch(e => {
    console.error("Error reding files", e);
  });
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
  const file = event.target.files[0];
  return JSZip.loadAsync(file)
    .then(function(zip) {
      const promises =  [];
      zip.forEach((name, zipEntry) => {
        if (zipEntry.dir || !checkWebExtension(name))
          return;

        const p = zip.file(name)
          .async("string")
          .then((data) => {
            return {
              name: name,
              data: data
            };
          }).catch(e => {
            console.error("Error decompressing", e);
          });

        promises.push(p);
      });
      return Promise.all(promises);
    });
};

