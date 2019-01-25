import $ from 'jquery';

import FileSaver from 'file-saver';

import findLCA from 'js/lca';
import html2hext from 'js/html2hext';
import constants from 'js/constants';
import { resize, sendHextUpwards } from 'js/api';
import {
  fromDirectoryDrop, fromDirectorySelect, fromZipSelect
} from 'js/loaders';

import style from 'css/style.css';

class Extractor {
  constructor(documents) {
    this.documents = documents || [];
    this.LCA = null;
    this.docIx = 0;
    this.selectedEls = [];
    // by default assume we're living inside a workbench module
    // turn this off to disable API functionality
    this.workbench = true;
    this.iframe = null;
  }

  onDirectorySelected(event) {
    event.stopPropagation();
    event.preventDefault();

    let loader = null;
    // directory drop event
    if (event.dataTransfer)
      loader = fromDirectoryDrop(event);
    else if (event.target.outerHTML.match("director-melector"))
      loader = fromDirectorySelect(event);
    else if (event.target.outerHTML.match("zip-selector"))
      loader = fromZipSelect(event);

    loader.then(results => {
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
    }).then(results => {
      this.documents = results;
      this.setupSelectionMode();
      this.startSelection();
    }).catch(e => {
      console.error("Data transfer error", e);
    });
  }

  showDirectoryLoader() {
    const that = this;
    $(constants.controlAreaId).hide();
    $(constants.directoryLoaderId).show();
    const dropArea = document.querySelector(constants.directorySelectorId);
    dropArea.addEventListener(
      'change', this.onDirectorySelected.bind(this), false);
    dropArea.addEventListener(
      'drop', this.onDirectorySelected.bind(this), false);
    document.querySelector(constants.zipSelectorId)
      .addEventListener("change", this.onDirectorySelected.bind(this), false);
  }

  showHextTemplate(hext) {
    $(constants.hextOverlayId).show();
    $(constants.hextDisplayId).text(hext);
    $(constants.hextDownloadId).on("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const type = {type: "text/plain;charset=utf-8"};
      const file = new File([hext], "extractor.hext", type);
      FileSaver.saveAs(file);
    });
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

  selectedNodeMenu(jqel, e) {
    e.preventDefault()
    e.stopPropagation();
    const menu = $(constants.selectedMenu);
    const eBox = e.target.getBoundingClientRect();
    const mBox = menu[0].getBoundingClientRect();
    const top = eBox.bottom + mBox.height
    const left = eBox.left - 6;
    menu.css({
      position: "relative",
      top: top,
      left: left
    });
    $(constants.selectedMenu).show();
    menu.find("#autoscrape-close").on("click", () => {
      this.deselectedNodeMenu(e);
    });
    // remove this menu on scroll. otherwise
    // we need to 1) move this with the window scroll
    // and 2) hide it when the menu is outside of
    // the iframe
    $("iframe").contents().scroll((e) => {
      this.deselectedNodeMenu(e);
    });
  }

  deselectedNodeMenu(e) {
    e.preventDefault()
    e.stopPropagation();
    $(constants.selectedMenu).hide();
  }

  iframeLoaded(e) {
    const doc = $("iframe");
    const contents = doc.contents();
    const all = contents.find("*");

    all.on("mouseenter mouseover", (e) => {
      e.stopPropagation();
      $(e.target).addClass(constants.overClass);
    });

    all.on("mouseleave mouseout", (e) => {
      e.stopPropagation();
      $(e.target).removeClass(constants.overClass);
    });

    all.on("click", (e) => {
      // don't propogate click upwards
      e.preventDefault()
      e.stopPropagation();

      const jqel = $(e.target);
      jqel.addClass(constants.selectedClass);

      // add to selected
      const selIx = this.selectedEls.indexOf(e);
      if(selIx === -1) {
        jqel.addClass(constants.selectedClass);
        this.selectedEls.push(e);
      }
      // remove from selected
      else {
        jqel.removeClass(constants.selectedClass);
        this.selectedEls.splice(selIx, 1);
      }

      // highlight parent element if we have some nodes
      const lca = findLCA(this.selectedEls);
      all.removeClass(constants.selectedParentClass);
      $(lca).addClass(constants.selectedParentClass);

      // this really shouldn't happen anymore. but we have
      // to recover from the possibility somehow
      if (!lca) {
        all.removeClass(constants.selectedParentClass);
        all.removeClass(constants.selectedClass);
        this.selectedEls = [];
      }
      // we have an LCA, grab the outerHTML and display the chunk
      else {
        const re = RegExp(`\\s*${constants.overClass}\\s*`, "g")
        const chunk = lca.outerHTML.replace(re, " ");
        this.LCA = chunk;
      }

      jqel.off("click");
      jqel.on("click", this.selectedNodeMenu.bind(this, jqel));
    });
  };

  startSelection() {
    const current = this.documents[this.docIx];
    const cleaned = current.html.replace(
      /<script.*>.*<\/script>|<link[^>]*\/>|<style.*>.*<\/style>|<iframe.*>.*<\/iframe>/mg,
      ""
    );
    const iframe = document.createElement('iframe');
    iframe.onload = this.iframeLoaded.bind(this);
    iframe.sandbox = "allow-same-origin";
    iframe.srcdoc = (
      cleaned +
      `<style>${current.css}</style>` +
      `<style>${constants.autoScrapeStyles}</style>`
    );
    if (this.iframe) {
      $("iframe").remove();
    }
    this.iframe = iframe;
    //$(constants.docAreaId).html(current.html);
    // this is hacky/brittle, find a more robust way to do this
    $(constants.currentDocNameId).val(current.name);
    $(constants.currentNumberId).text(this.docIx + 1);
    $(constants.totalNumberId).text(this.documents.length);
    document.body.appendChild(iframe);
  }

  stopSelection() {
    const doc = $("iframe");
    const contents = doc.contents();
    const all = contents.find("*");
    all.removeClass(constants.overClass);
    all.off();
    all.on("click", (e) => {
      e.preventDefault()
      e.stopPropagation();
    });
    if (this.iframe) {
      $("iframe").remove();
      this.iframe = null;
    }
  }

  selectionComplete() {
    this.stopSelection();
    const hext = html2hext(this.LCA.replace("\n", "").trim());
    if (this.workbench) {
      sendHextUpwards(hext);
    }
    else {
      this.showHextTemplate(hext);
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
    .then((embeddata) => {
      if (!embeddata.data) {
        resize(0);
      }
      else {
        resize(500);
        extractor.documents = embeddata.data;
        extractor.setupSelectionMode();
        extractor.startSelection();
      }
    })
    .catch(e => {
      console.error("Failure to load embeddata from API:\n", e);
      extractor.workbench = false;
      extractor.showDirectoryLoader();
    });
};

window.addEventListener('hashchange', startLoading);
startLoading();

