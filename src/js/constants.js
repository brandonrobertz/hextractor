const constants = {
  // Classes for the HTML document iFrame. Adds
  // visual indications of selected and parent elements.
  // These also are custom attributes that the extractor
  // generating function looks for, as cues for doing
  // specific things when generating template.
  selectedClass: "hextractor-selected",
  selectedParentClass: "hextractor-selected-parent",
  overClass: "hextractor-over",
  alsoSelectedClass: "hextractor-also-selected",
  selectLikeClass: "hextractor-select-like",
  optionalClass: "hextractor-optional",
  labelAttr: "hextractor-column-label",
  uniqIdAttr: "hextractor-uniq-id",

  // length (in chars) of the random id used to mark HTML
  // elements for Hext additional records highlighting
  idLength: 32,

  // main wrapper where we drop the document
  docAreaId: "#hextractor-doc-area",
  docLoadingId: "#loading-shim",

  // controls header
  controlAreaId: "#hextractor-controls",

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
  selectedMenu: "#hextractor-selected-menu",

  // selected element dropdown menu controls
  menuLabel: "input#hextractor-column-name",
  menuSave: "#hextractor-save",
  menuOptional: "#hextractor-optional",
  menuSelectLike: "#hextractor-select-like",
  menuRemove: "#hextractor-remove",
  menuCancel: "#hextractor-cancel",

  // style to inject into document iframe for rendering the
  // display of selected items, etc
  autoScrapeStyles: `
.hextractor-over {
  box-shadow: 0px 0px 0px 2px #FBAA6D !important;
}
.hextractor-selected {
  background-color: #ebf9fb !important;
  box-shadow: 0px 0px 0px 2px #00CBE1 !important;
}
.hextractor-select-like {
  box-shadow: 0px 0px 0px 5px #868B82 !important;
}
.hextractor-optional {
  box-shadow: 0px 0px 0px 5px #FF8BD2 !important;
}
.hextractor-selected-parent .hextractor-selected.hextractor-over {
  background-color: #fceded !important;
  box-shadow: 0px 0px 0px 2px #E24F4A !important;
}
/*
.hextractor-selected-parent {
  box-shadow: 0px 0px 0px 5px darkorange !important;
}
*/
.hextractor-also-selected {
  background-color: #CCFFCD !important;
  box-shadow: 0px 0px 0px 2px #6DFB71 !important;
`,

}

export default constants;
