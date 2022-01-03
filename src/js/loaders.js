import { getFilesFromDataTransferItems } from 'datatransfer-files-promise';

const TEXT_EXTENSIONS = [
  ".asp",
  ".aspx",
  ".axd",
  ".asx",
  ".asmx",
  ".ashx",
  ".css",
  ".cfm",
  ".yaws",
  ".html",
  ".htm",
  ".xhtml",
  ".jhtml",
  ".hta",
  ".jsp",
  ".jspx",
  ".wss",
  ".do",
  ".action",
  ".pl",
  ".php",
  ".php4",
  ".php3",
  ".phtml",
  ".rb",
  ".rhtml",
  ".shtml",
  ".xml",
  ".rss",
  ".svg",
  ".cgi",
  ".dll",
  ".axd",
  ".asx",
  ".asmx",
  ".ashx",
  ".aspx",
  ".xml",
  ".rss",
  ".atom",
]

const isExtensionHTML = (name) => {
  // AutoScrape directory files will always have an extension
  // TODO: handle other HTML-like non-.html extensions (e.g., .php)
  const matches = TEXT_EXTENSIONS.map(
    (ext) => name.toLowerCase().endsWith(ext)
  ).filter((x) => x);
  console.log("Matches", matches);
  return matches.length > 0;
};

async function readFiles(files) {
  const loadedFiles = [];
  for (let i = 0; i < files.length; ++i) {
    const file = files[i];
    console.log("Considering file:", file.name, file);
    if (!isExtensionHTML(file.name)) {
      console.log("Skipping file", file.name);
      continue;
    }

    console.log("Using", file.name);

    const loadedFile = {
      "data": await file.text(),
      "name": file.name,
    };
    console.log("Loaded", loadedFile);

    loadedFiles.push(loadedFile);
  }

  return loadedFiles;
}

export async function fromDirectoryDrop(event) {
  const items = event.dataTransfer.items;
  console.log("ITEMS", items);
  return getFilesFromDataTransferItems(items)
    .then(async (files) => {
      const loadedFiles = await readFiles(files);
      console.log("loadedFiles", loadedFiles);
      return loadedFiles;
    });
}

export async function fromDirectorySelect(event) {
  const loadedFiles = await readFiles(event.target.files);
  console.log("loadedFiles", loadedFiles);
  return loadedFiles;
}
