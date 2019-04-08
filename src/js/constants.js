const constants = {
  // Classes for the HTML document iFrame. Adds
  // visual indications of selected and parent elements.
  // These also are custom attributes that the extractor
  // generating function looks for, as cues for doing
  // specific things when generating template.
  selectedClass: "autoscrape-selected",
  selectedParentClass: "autoscrape-selected-parent",
  overClass: "autoscrape-over",
  alsoSelectedClass: "autoscrape-also-selected",
  selectLikeClass: "autoscrape-select-like",
  optionalClass: "autoscrape-optional",
  labelAttr: "autoscrape-column-label",
  uniqIdAttr: "autoscrape-uniq-id",

  // length (in chars) of the random id used to mark HTML
  // elements for Hext additional records highlighting
  idLength: 32,

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

  // selected element dropdown menu controls
  menuLabel: "input#autoscrape-column-name",
  menuSave: "#autoscrape-save",
  menuOptional: "#autoscrape-optional",
  menuSelectLike: "#autoscrape-select-like",
  menuRemove: "#autoscrape-remove",
  menuCancel: "#autoscrape-cancel",

  // style to inject into document iframe for rendering the
  // display of selected items, etc
  autoScrapeStyles: `
.autoscrape-over {
  box-shadow: 0px 0px 0px 2px #FBAA6D !important;
}
.autoscrape-selected {
  background-color: #ebf9fb !important;
  box-shadow: 0px 0px 0px 2px #00CBE1 !important;
}
.autoscrape-select-like {
  box-shadow: 0px 0px 0px 5px #868B82 !important;
}
.autoscrape-optional {
  box-shadow: 0px 0px 0px 5px #FF8BD2 !important;
}
.autoscrape-selected-parent .autoscrape-selected.autoscrape-over {
  background-color: #fceded !important;
  box-shadow: 0px 0px 0px 2px #E24F4A !important;
}
/*
.autoscrape-selected-parent {
  box-shadow: 0px 0px 0px 5px darkorange !important;
}
*/
.autoscrape-also-selected {
  background-color: #CCFFCD !important;
  box-shadow: 0px 0px 0px 2px #6DFB71 !important;
`,

}

export default constants;
