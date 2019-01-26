import $ from 'jquery';

import constants from 'js/constants';

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
    const uid = makeid(32);
    $(el).attr("autoscrape-uniq-id", uid);
    const contents = $(el).contents();
  });
};

const replaceTextContent = (html) => {
  const all = $(html).find("*");
  all.each(function(){
    const uid = $(this).attr("autoscrape-uniq-id");
    $(this).contents().each((_, node) => {
      // map ID to original text
      if (node.nodeType === 3)
        node.textContent = uid;
    });
  });
};

const checkAlreadySelected = (el) => {
  if (!el.classList.length)
    return false;
  return el.classList.contains(constants.selectedClass);
};

export const highlightNodes = (hext, html) => {
  tagAll(html);
  const dom = html.cloneNode(true);
  replaceTextContent(dom);
  const json = Module.ccall(
    "html2json",
    "string",
    ["string", "string"],
    [hext, dom.outerHTML]
  );

  const parsed = JSON.parse(json);
  for (let i in parsed) {
    const row = parsed[i];
    for (let key in row) {
      const val = row[key];
      const contents = $("iframe").contents();
      const elements = contents.find(`[autoscrape-uniq-id="${val}"]`);
      const found = elements[elements.length-1];
      // some text tags, like anchor links and img src won't have
      // matches, so we just ignore for now
      if (!found) {
        console.warn("Skipping val", val);
        continue;
      }
      if (!checkAlreadySelected(found)) {
        $(found).addClass("autoscrape-also-selected");
      }
    }
  }
};
