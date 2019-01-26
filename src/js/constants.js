const constants = {
  selectedClass: "autoscrape-selected",
  selectedParentClass: "autoscrape-selected-parent",
  overClass: "autoscrape-over",
  optionalClass: "autoscrape-optional",
  labelAttr: "autoscrape-column-label",

  // main wrapper where we drop the document
  docAreaId: "#autoscrape-doc-area",
  docLoadingId: "#loading-shim",

  // controls header
  controlAreaId: "#autoscrape-controls",

  // AutoScrape directory loader
  directoryLoaderId: "#directory-loader",
  directorySelectorId: "#directory-selector",
  zipSelectorId: "#zip-selector",

  // overlay to show Hext template
  hextOverlayId: "#hext-overlay",
  hextDisplayId: "#hext-area",
  hextDownloadId: "#hext-download-btn",

  // elements to store meta information
  currentNumberId: "#current-number",
  totalNumberId: "#total-number",
  currentDocNameId: "#current-doc-name",

  // buttons for changing, canceling, etc
  previousDocumentId: "#prev-btn",
  nextDocumentId: "#next-btn",
  completeSelectionId: "#complete-btn",
  cancelSelectionId: "#cancel-btn",

  // selected item menu
  selectedMenu: "#autoscrape-selected-menu",

  // style to inject into iframe for rendering the
  // display of selected items, etc
  autoScrapeStyles: `
.autoscrape-over {
  box-shadow: 0px 0px 0px 2px #FBAA6D !important;
}
.autoscrape-selected {
  background-color: #86F3FF !important;
  box-shadow: 0px 0px 0px 2px #268BD2 !important;
}
.autoscrape-optional {
  background-color: #86F3FF !important;
  box-shadow: 0px 0px 0px 2px #FF8BD2 !important;
}
.autoscrape-selected-parent {
  box-shadow: 0px 0px 100px 1000px rgba(0.5, 0.5, 0.5, 0.1) !important;
}
.autoscrape-also-selected {
  background-color: #91DC47 !important;
  box-shadow: 0px 0px 0px 2px #708F1B !important;
}
`,

}

export default constants;
