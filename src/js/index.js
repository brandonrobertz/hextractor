import $ from 'jquery';

import FileSaver from 'file-saver';

import findLCA from 'js/lca';
import html2hext from 'js/html2hext';
import constants from 'js/constants';
import { resize, sendHextUpwards } from 'js/api';
import {
  fromDirectoryDrop, fromDirectorySelect, fromZipSelect
} from 'js/loaders';
import { highlightNodes } from 'js/hextHighlighting';

import style from 'css/style.css';


class Extractor {
  constructor(documents) {
    // Array of HTML documents that we way want to extract from
    this.documents = documents || [];
    // Lowest common ancestor gets stored here
    this.LCA = null;
    // Index of the curently selected HTML document
    this.docIx = 0;
    // Elements the user has selected for extraction
    this.selectedEls = [];
    // Events generated upon selecting an element for extraction
    this.selectedEvents = [];
    // by default assume we're living inside a workbench module
    // turn this off to disable API functionality
    this.workbench = true;
    // the iFrame we will manage and place sandboxed HTML documents into
    this.iframe = null;
  }

  onDirectorySelected(event) {
    event.stopPropagation();
    event.preventDefault();

    let loader = null;
    // directory drop event
    if (event.dataTransfer)
      loader = fromDirectoryDrop(event);
    else if (event.target.outerHTML.match("directory-selector"))
      loader = fromDirectorySelect(event);
    else if (event.target.outerHTML.match("zip-selector"))
      loader = fromZipSelect(event);
    else {
      console.error("No loader for event", event);
      return;
    }

    loader.then(results => {
      // group HTML and CSS documents together under the
      // HTML filename's key
      const htmlAndCSS = {};
      results.forEach(result => {
        const matches = result.name.match(/(.*)\.([^\.]{3,})$/);
        let extension = matches[2];
        if (extension !== "css") {
          extension = "html";
        }
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
      this.loadDocumentFrame();
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

  /**
   * Setup event handlers for interacting with documents via
   * the header controls and reset the LCA/selected nodes
   * state.
   */
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
    $(constants.cancelSelectionId).on(
      "click", this.selectionCancel.bind(this)
    );

    this.LCA = null;
    this.docIx = 0;
    this.selectedEls = [];
  }

  /**
   * Find the position of an element on the page in
   * [x, y] format.
   */
  findPos(obj) {
    var curleft = 0;
    var curtop = 0;
    if (obj.offsetParent) {
      do {
        curleft += obj.offsetLeft;
        curtop += obj.offsetTop;
      } while (obj = obj.offsetParent);
      return [curleft,curtop];
    }
  }

  /**
   * Check menu button (via click event) to see if it's
   * already selected. If it is, return true, else false.
   * This also handles the selected class on the element
   * so users know the option is selected.
   */
  toggleMenuButton(event) {
    const btn = $(event.target);
    if (event.target.classList.contains("selected")) {
      btn.removeClass("selected");
      return true;
    } else {
      btn.addClass("selected");
      return false;
    }
  }

  /**
   * Opens a selected element control menu for removing (deselcting)
   * and labeling the column.
   */
  openNodeMenu(e, el) {
    const menu = $(constants.selectedMenu);
    const currentScroll = (function findBody(thisEl) {
      if(!thisEl.parentElement) {
        return thisEl.scrollTop;
      }
      return findBody(thisEl.parentNode);
    })(el);

    const saveBtn = menu.find(constants.menuSave);
    saveBtn.on("click", () => {
      const label = $(constants.menuLabel).val();
      $(el).attr(constants.labelAttr, label);
      this.closeNodeMenu();
      this.performLCA();
    });
    const cancelBtn = menu.find(constants.menuCancel);
    cancelBtn.on("click", (btnE) => {
      $(el).removeClass(constants.selectedClass);
      this.deselectNode(e, el);
      this.closeNodeMenu();
    });
    const optionalBtn = menu.find(constants.menuOptional);
    optionalBtn.on("click", (btnE) => {
      if (!this.toggleMenuButton(btnE)) {
        $(el).addClass(constants.optionalClass);
      } else {
        $(el).removeClass(constants.optionalClass);
      }
    });
    const selectLikeBtn = menu.find(constants.menuSelectLike);
    selectLikeBtn.on("click", (btnE) => {
      if (!this.toggleMenuButton(btnE)) {
        $(el).addClass(constants.selectLikeClass);
      } else {
        $(el).removeClass(constants.selectLikeClass);
      }
    });

    // remove this menu on scroll. otherwise
    // we need to 1) move this with the window scroll
    // and 2) hide it when the menu is outside of
    // the iframe
    $("iframe").contents().scroll((el) => {
      this.closeNodeMenu();
    });

    // show it last
    const pos = this.findPos(e.target);
    const eBox = e.target.getBoundingClientRect();
    menu.css({
      position: "relative",
      top: pos[1] + eBox.height + 50 - currentScroll,
      left: pos[0] - 6
    });
    $(constants.selectedMenu).show();
    $(constants.menuLabel).focus();
  }

  closeNodeMenu() {
    const menu = $(constants.selectedMenu);
    const saveBtn = menu.find(constants.menuSave);
    saveBtn.off("click");
    const removeBtn = menu.find(constants.menuRemove);
    removeBtn.off("click");
    const cancelBtn = menu.find(constants.menuCancel);
    cancelBtn.off("click");
    const optionalBtn = menu.find(constants.menuOptional);
    optionalBtn.off("click");
    const selectLikeBtn = menu.find(constants.menuSelectLike);
    selectLikeBtn.off("click");
    $(constants.menuLabel).val("");
    $(constants.selectedMenu).hide();
  }

  deselectNode(e, el) {
    this.selectNode(e, el, true);
  }

  /**
   * This gets fired when a user either selects or deselects
   * (by re-selecting) an element for extraction.
   */
  selectNode(e, el, deselect=false) {
    // don't propogate click upwards
    e.preventDefault()
    e.stopPropagation();
    this.closeNodeMenu();

    const all = this.allDocNodes();
    const jqel = $(el);

    const selElIx = this.selectedEls.indexOf(el);
    const unselect = deselect || selElIx > -1;

    if (!unselect)
      jqel.addClass(constants.selectedClass);

    // add to selected
    if(!unselect) {
      jqel.addClass(constants.selectedClass);
      this.selectedEls.push(el);
      this.selectedEvents.push(e);
    }
    else {
      jqel.removeClass(constants.selectedClass);
      jqel.removeClass(constants.optionalClass);
      jqel.removeClass(constants.selectLikeClass);
      jqel.removeAttr(constants.labelAttr);
      this.selectedEls.splice(selElIx, 1);
      this.selectedEvents.splice(selElIx, 1);
      this.closeNodeMenu();
    }

    //jqel.off("click");
    // TODO: on click of jqel, deactivate the menu
    if (!unselect) {
      this.openNodeMenu(e, jqel[0]);
    } else {
      this.performLCA();
    }
  }

  /**
   * Given our selected elements, find the Lowest Common Ancestor, by
   * crawling upwards through the DOM until we find the first common
   * ancestor.
   *
   * If no LCA is found, we clear everything because this should only happen
   * when the last element is deselected.
   *
   * This function also calls out for additional record highlighting.
   */
  performLCA() {
    const all = this.allDocNodes();

    // highlight parent element if we have some nodes
    const lca = findLCA(this.selectedEls);
    all.removeClass(constants.selectedParentClass);
    $(lca).addClass(constants.selectedParentClass);

    // this really shouldn't happen anymore. but we have
    // to recover from the possibility somehow
    if (!lca) {
      console.error("No LCA found! Clearing selections");
      all.removeClass(constants.selectedParentClass);
      all.removeClass(constants.selectedClass);
      all.removeClass(constants.optionalClass);
      all.removeClass(constants.selectLikeClass);
      all.removeClass(constants.alsoSelectedClass);
      this.selectedEls = [];
    }
    // we have an LCA, grab the outerHTML and display the chunk
    else {
      const re = RegExp(`\\s*${constants.overClass}\\s*`, "g")
      const chunk = lca.outerHTML.replace(re, " ");
      this.LCA = chunk;
    }

    // show other captured nodes
    if (Module && lca) {
      const html = $("iframe").contents().find("html");
      const outer = lca.outerHTML;
      const hext = html2hext(outer);
      highlightNodes(hext, html[html.length - 1]);
    }

    this.updateCompleteBtnState();
  }

  /**
   * Return all elements inside of our document iFrame.
   * We use this to set onclick/onhover events that dispatch
   * out to template building functions.
   */
  allDocNodes() {
    const doc = $("iframe");
    const contents = doc.contents();
    const all = contents.find("*");
    return all;
  }

  iframeLoaded(e) {
    $(constants.docLoadingId).hide();

    const that = this;
    const all = this.allDocNodes();

    all.on("mouseenter mouseover", (e) => {
      e.stopPropagation();
      $(e.target).addClass(constants.overClass);
    });

    all.on("mouseleave mouseout", (e) => {
      e.stopPropagation();
      $(e.target).removeClass(constants.overClass);
    });

    all.on("click", (e) => {
      that.selectNode(e, e.target);
    });
  };

  /**
   * Load iFrame and meta data in header for this document
   * then dispatch to setting up event (hover/click) handlers.
   */
  loadDocumentFrame() {
    const current = this.documents[this.docIx];
    const iframes = document.getElementsByTagName("iframe");
    for (var i = 0; i < iframes.length; i++) {
      iframes[i].remove();
    }
    const iframe = document.createElement('iframe');
    // TODO: add a hook to show a "loading" mask over iframe
    $(constants.docLoadingId).show();
    iframe.onload = this.iframeLoaded.bind(this);
    iframe.sandbox = "allow-same-origin";
    iframe.srcdoc = (
      current.html +
      `<style>${current.css}</style>` +
      `<style>${constants.autoScrapeStyles}</style>`
    );
    if (this.iframe) {
      $("iframe").remove();
    }
    this.iframe = iframe;

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

  /**
   * Restart the current page selection state.
   */
  selectionCancel() {
    this.selectedEls.forEach((_, i) => {
      const e = this.selectedEls[i];
      const el = this.selectedEvents[i];
      this.deselectNode(el, e);
    });
    this.closeNodeMenu();
    this.selectedEvents = [];
    this.selectedEls = [];
    this.LCA = null;
    this.performLCA();
  }

  hasSelectionBeenMade() {
    return this.LCA && this.selectedEls && this.selectedEls.length;
  }

  updateCompleteBtnState() {
    const completeBtn = $(constants.completeSelectionId);
    if (this.hasSelectionBeenMade()) {
      // remove disabled from complete button
      completeBtn.removeClass("disabled");
    } else {
      // add remove disabled from complete button if not there
      completeBtn.addClass("disabled");
    }
  }

  /**
   * We're done selecting nodes. Now create Hext and
   * dispatch.
   */
  selectionComplete() {
    // disable the selection complete if no selection made
    if (!this.hasSelectionBeenMade()) {
      return;
    }

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
    this.loadDocumentFrame();
  }

  prevDocument() {
    this.stopSelection();
    this.docIx--;
    if (this.docIx < 0) {
      this.docIx = this.documents.length - 1;
    }
    this.loadDocumentFrame();
  }
}

/**
 * ENTRY POINT
 *
 * We check to see if we're in a Workbench environment,
 * otherwise we load the standalone browser workflow. Note
 * that we check for Workbench by attempting to use the
 * /embeddata endpoint, which ought to return paramaters
 * (HTML documents, template if it exists) for the extractor
 * module.
 */
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
        resize(null);
        extractor.documents = embeddata.data;
        extractor.setupSelectionMode();
        extractor.loadDocumentFrame();
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

