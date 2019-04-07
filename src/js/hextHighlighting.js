import $ from 'jquery';

import constants from 'js/constants';

/**
 * Make a random ID that will, ultimately, uniquely identify
 * an element in the DOM.
 */
const makeid = (n) => {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < n; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
};

/**
 * Tag every element in our rendered document DOM with
 * a unique ID. This ID will then be used to replace
 * the text content of every node in a cloned DOM which
 * will get shipped to Hext. We can use the output
 * of Hext to identify elements on a page which will
 * be extracted by Hext.
 */
const tagAll = (html) => {
  const all = $(html).find("*");
  all.each((_, el) => {
    const uid = makeid(constants.idLength);
    $(el).attr(constants.uniqIdAttr, uid);
  });
};

/**
 * Replace the text of the DOM, on every element, with
 * a randomly generated string. We use this to map the
 * extractor output to the nodes where the data originates
 * for highlighting purposes.
 */
const replaceTextContent = (html) => {
  const all = $(html).find("*");
  all.each(function(){
    const uid = $(this).attr(constants.uniqIdAttr);
    $(this).contents().each((_, node) => {
      // map ID to original text
      if (node.nodeType === 3)
        node.textContent = uid;
    });
  });
};

/**
 * Check if the given node is one that we've directly
 * selected via user click. We don't want to additonally
 * highlight these.
 */
const checkAlreadySelected = (el) => {
  if (!el.classList.length)
    return false;
  return el.classList.contains(constants.selectedClass);
};

/**
 * Main entry point for highlighting nodes that will be
 * additionally selected by the Hext extraction template.
 */
export const highlightNodes = (hext, html) => {
  if (!Module) {
    return console.warn("No emscripten Hext library found. " +
      "Not performing additional highlighting.");
  }

  tagAll(html);
  const domClone = html.cloneNode(true);
  replaceTextContent(domClone);
  const outer = domClone.outerHTML;
  const json = Module.ccall(
    "html2json",
    "string",
    ["string", "string"],
    [hext, outer]
  );

  const parsed = JSON.parse(json);
  for (let i in parsed) {
    const row = parsed[i];
    for (let key in row) {
      const rawVal = row[key];
      const recs = rawVal.length / constants.idLength;
      // skip non-ID values which may slip in (-link, -src, etc)
      if (recs % 1 != 0) continue;
      for (let i = 0; i < recs; i++) {
        const start = i * constants.idLength;
        const end = (i + 1) * constants.idLength;
        const val = rawVal.slice(start, end);
        const contents = $("iframe").contents();
        const elements = contents.find(`[${constants.uniqIdAttr}="${val}"]`);
        const found = elements[elements.length-1];
        // some text tags, like anchor links and img src won't have
        // matches, so we just ignore for now
        if (!found) {
          console.warn("Skipping val", val);
          continue;
        }
        if (!checkAlreadySelected(found)) {
          $(found).addClass(constants.alsoSelectedClass);
        }
      }
    }
  }
};
