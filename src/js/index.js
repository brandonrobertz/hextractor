import $ from 'jquery';

import { getFilesFromDataTransferItems } from 'datatransfer-files-promise';

import findLCA from 'js/lca';
import html2hext from 'js/html2hext';
import constants from 'js/constants';
import { sendHextUpwards } from 'js/api';

class Extractor {
  constructor(documents) {
    this.documents = documents || [];
    this.LCA = null;
    this.docIx = 0;
    this.selectedEls = [];
    // by default assume we're living inside a workbench module
    // turn this off to disable API functionality
    this.workbench = true;
  }

  readLocalFiles(files) {
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
  }

  showDirectoryLoader() {
    const that = this;
    $(constants.controlAreaId).hide();
    $(constants.directoryLoaderId).show();
    const dropArea = document.querySelector(constants.directorySelectorId);
    dropArea.addEventListener('drop', event => {
      event.stopPropagation();
      event.preventDefault();

      const items = event.dataTransfer.items;
      getFilesFromDataTransferItems(items)
        .then(files => {
          return that.readLocalFiles(files);
        })
        .then(results => {
          // group HTML and CSS documents together under the
          // HTML filename's key
          const htmlAndCSS = {};
          results.forEach(result => {
            const matches = result.name.match(/(.*)\.([^\.]{3,})$/);
            const extension = matches[2];
            let filename = result.name;
            // AutoScrape saves CSS as [path].html.css
            if (result.name.endsWith(".css")) {
              filename = matches[1];
            }
            if (!htmlAndCSS[filename]) {
              htmlAndCSS[filename] = {
                name: filename
              };
            }
            htmlAndCSS[filename][extension] = result.data;
          });
          // flatten into an array
          return Object.keys(htmlAndCSS).map(name => {
            const css = htmlAndCSS[name].css;
            const html = htmlAndCSS[name].html;
            return {
              name: name,
              css: css,
              html: html
            };
          });
        })
        .then(results => {
          this.documents = results;
          this.setupSelectionMode();
          this.startSelection();
        })
        .catch(e => {
          console.error("Data transfer error", e);
        });
    }, false);
  }

  setupSelectionMode() {
    $(constants.directoryLoaderId).hide();
    $(constants.controlAreaId).show();
    $(constants.nextDocumentId).on(
      "click", this.nextDocument.bind(this)
    );
    $(constants.previousDocumentId).on(
      "click", this.prevDocument.bind(this)
    );
    $(constants.completeSelectionId).on(
      "click", this.selectionComplete.bind(this)
    );

    this.LCA = null;
    this.docIx = 0;
    this.selectedEls = [];
  }

  renderDocument() {
    const current = this.documents[this.docIx];
    $(constants.docAreaId).html(current.html);
    // this is hacky/brittle, find a more robust way to do this
    $(constants.docAreaId).append(`<style>${current.css}</style>`);
    $(constants.currentDocNameId).val(current.name);
    $(constants.currentNumberId).text(this.docIx + 1);
    $(constants.totalNumberId).text(this.documents.length);
  }

  startSelection() {
    this.renderDocument();
    const els = $(constants.docAreaId).find("*");
    // we need both enter/leave and over/out pairs
    // for this to work correctly with nested nodes
    els.on("mouseenter mouseover", (e) => {
      e.stopPropagation();
      $(e.target).addClass(constants.overClass);
    });
    els.on("mouseleave mouseout", (e) => {
      e.stopPropagation();
      $(e.target).removeClass(constants.overClass);
    });
    // when we click, add the node to our node list
    // and also outline it
    els.on("click", (e) => {
      // don't propogate click upwards
      e.preventDefault()
      e.stopPropagation();

      // add to selected
      const selIx = this.selectedEls.indexOf(e);
      if(selIx === -1) {
        $(e.target).addClass(constants.selectedClass);
        this.selectedEls.push(e);
      }
      // remove from selected
      else {
        $(e.target).removeClass(constants.selectedClass);
        this.selectedEls.splice(selIx, 1);
      }

      // highlight parent element if we have some nodes
      const lca = findLCA(this.selectedEls);
      $("*").removeClass(constants.selectedParentClass);
      $(lca).addClass(constants.selectedParentClass);

      // this really shouldn't happen anymore. but we have
      // to recover from the possibility somehow
      if (!lca) {
        $("*").removeClass(constants.selectedParentClass);
        $("*").removeClass(constants.selectedClass);
        this.selectedEls = [];
      }
      // we have an LCA, grab the outerHTML and display the chunk
      else {
        // NOTE: if overClass changes, this needs to change
        const re = RegExp(`\\s*${constants.overClass}\\s*`, "g")
        const chunk = lca.outerHTML.replace(re, " ");
        // $("#lca-html").text(chunk).html();
        this.LCA = chunk;
      }
    });
  }

  stopSelection() {
    //$(constants.docAreaId).html("");
    const els = $(constants.docAreaId).find("*");
    els.removeClass(constants.overClass);
    els.off();
    els.on("click", (e) => {
      e.preventDefault()
      e.stopPropagation();
    });
    //$("#complete").hide();
  }

  selectionComplete() {
    this.stopSelection();
    const hext = html2hext(this.LCA.replace("\n", "").trim());
    if (this.workbench) {
      sendHextUpwards(hext);
    }
  }

  nextDocument() {
    this.stopSelection();
    this.docIx++;
    this.docIx = this.docIx % this.documents.length;
    this.startSelection();
  }

  prevDocument() {
    this.stopSelection();
    this.docIx--;
    if (this.docIx < 0) {
      this.docIx = this.documents.length - 1;
    }
    this.startSelection();
  }
}

export const startLoading = (d) => {
  const extractor = new Extractor();
  const url = String(window.location).replace(/\/output.*/, '/embeddata');
  fetch(url, { credentials: 'same-origin' })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Invalid response code: ' + response.status)
      }
      return response.json()
    })
    .then((data) => {
      if (!data.html) {
        resize(0);
      }
      else {
        resize(500);
        //dataReady(data);
        extractor.documents = data;
        extractor.setupSelectionMode();
        extractor.startSelection();
      }
    })
    .catch((e) => {
      console.error("Failure to load embeddata from API:\n", e);
      extractor.workbench = false;
      extractor.showDirectoryLoader();
    });
};

window.addEventListener('hashchange', startLoading);
startLoading();

