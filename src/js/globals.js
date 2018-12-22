const selectedClass = "autoscrape-selected";
const selectedParentClass = "autoscrape-selected-parent";
// NOTE: if overClass changes, change the regex replacement
// on the HTML chunk below (bottom of runUI method)
const overClass = "autoscrape-over";
// save our LCA HTML chunk here (HACK)
let LCA = null;
let docIx = -1;

