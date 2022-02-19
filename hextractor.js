import { Rule, Html } from 'https://cdn.jsdelivr.net/gh/html-extract/hext.js/dist/hext.mjs';
import findLCA from "/src/js/lca.js";

const right_pane = document.getElementById("right");
const submit_button = document.getElementById("load-page");
const loader_form = document.getElementById("loader");
const html_file = document.getElementById("page-file");
const run_button = document.getElementById("run-hext");
const clear_button = document.getElementById("clear-results");
const clear_hext_btn = document.getElementById("clear-hext");
const status_output = document.getElementById("status");
const hide_button = document.getElementById("hide");
const element_tag = document.querySelector("#element-info .tag");
const element_attrs = document.querySelector("#element-info .attrs");
const curr_padding = document.getElementById("current-padding");
const inc_padding = document.getElementById("inc-padding");
const dec_padding = document.getElementById("dec-padding");

const ERROR_COLOR = "rgba(255, 0, 0, 0.1)";
const HOVER_STYLE = "aqua 0 0 25px";
const SELECTED_STYLE = ".hext-selected { box-shadow: rgba(255, 239, 0, 0.6) 0 0 10px; }";
const LCA_STYLE = ".hext-lca { box-shadow: rgba(55, 255, 55, 0.6) 0 0 5px; } ";
const RESULT_ROOT_STYLE = ".hext-result-root { box-shadow: rgba(139, 0, 255, 0.5) 0 0 5px; }";
const RESULT_ITEM_STYLE = ".hext-result-item { box-shadow: rgba(255, 0, 150, 0.5) 0 0 5px; }";
let PAD_ALL_WIDTH = 1;

const hext_input = ace.edit("hext", {
  // theme: "ace/theme/iplastic",
  // theme: "ace/theme/textmate",
  theme: "ace/theme/tomorrow",
  mode: "ace/mode/hext",
  maxLines: 10,
  minLines: 10,
  wrap: true,
  autoScrollEditorIntoView: true
});
const json_output = ace.edit("json", {
  theme: "ace/theme/tomorrow",
  mode: "ace/mode/yaml",
  maxLines: 5,
  minLines: 1,
  wrap: true,
  autoScrollEditorIntoView: false
});

const uniqueCharSet = "abcdef0123456789";
function uniqueId(n) {
  return [...Array(n||32).keys()].map(()=>{
    return uniqueCharSet.charAt(Math.round(Math.random()*15));
  }).join("");
}

function setStatus(msg, error) {
  if (error) 
    console.error("Error:", msg);
  else
    console.log("Status:", msg);

  status_output.value = msg;

  if (error) {
    status_output.style.backgroundColor = ERROR_COLOR;
  }
  // disable error color if it's set and this isn't an error
  else if (status_output.style.backgroundColor === ERROR_COLOR) {
    status_output.style.backgroundColor = null;
  }
}

function clearText(elem){
  // if (!el.childElementCount && el.innerText)
  //   el.innerText = "";

  if(elem.firstChild && elem.firstChild.nodeType === 3) {
    elem.firstChild.nodeValue = '';
  } 

  if(elem.children.length) {
    for (let i = 0; i < elem.children.length; i++) {
      clearText(elem.children[i]); 
    }
  }
}

function elClicked(e) {
  e.preventDefault();
  e.stopPropagation();
  e.target.toggleAttribute("hext-selected");
  e.target.classList.toggle("hext-selected");

  const iframe = document.querySelector("iframe").contentDocument;
  const selecteds = [];
  // turn into a list
  iframe.querySelectorAll('[hext-selected]').forEach((node) => {
    selecteds.push(node);
  });
  const lca = findLCA(selecteds);
  iframe.querySelectorAll("[hext-lca]").forEach((el)=>{
    el.removeAttribute("hext-lca");
    el.classList.remove("hext-lca");
  });
  lca.setAttribute("hext-lca", "");
  lca.classList.add("hext-lca");

  /**
   * BEGIN HTML => HEXT LOGIC
   *
   * We do this via DOM traversal, pruning and replacing the
   * selected nodes with hext extractor syntax. Once we're done,
   * we convert it all to a hext template string.
   */

  // create a hidden node to attach our lca chunk to,
  // we're going to use this to prune the tree and build
  // a hext template from
  const treeWrapper = document.createElement("div");
  treeWrapper.innerHTML = lca.outerHTML;
  treeWrapper.setAttribute("hext-treewrapper", "");
  window.treeWrapper = treeWrapper;

  console.log("Pre-pruning", treeWrapper.innerHTML);

  // mark all nodes for deletion
  treeWrapper.querySelectorAll("*").forEach((el) => {
    el.setAttribute("hext-delete", "");
    // try to clean this up for debugging
    el.removeAttribute("style");
    el.removeAttribute("class");
  });

  // then find all selected nodes, walk up, and
  // mark for un-deletion until we hit the wrapper
  treeWrapper.querySelectorAll("[hext-selected]").forEach((node) => {
    while (node && !node.hasAttribute("hext-treewrapper")) {
      node.removeAttribute("hext-delete");
      node = node.parentNode;
    }
  });

  // this will remove all the dead branches in our DOM
  treeWrapper.querySelectorAll("[hext-delete]").forEach((el) => {
    if (!el.hasAttribute("hext-treewrapper")) {
      el.parentNode.removeChild(el);
      el.remove();
    }
  });

  console.log("Pst-pruning", treeWrapper.innerHTML);

  // we increment this upon first use per element
  let selId = 0;
  treeWrapper.querySelectorAll("*").forEach((el) => {
    el.removeAttribute("hext-lca");
    el.removeAttribute("hext-id");

    // always remove id from elements
    el.removeAttribute("id");
    // and href
    el.removeAttribute("href");

    if (el.hasAttribute("hext-selected")) {
      el.setAttribute("hext-selector", `@text:element_${++selId}_text`);

      for(let key in el.attributes) {
        if (!el.getAttribute(key))
          continue;
        if (key.match(/\s/))
          continue
        // the value here is going to turn into our hext selector
        // for this node
        el.setAttribute(
          "hext-selector",
          `${key}:element_${selId}_text ` + (
            el.getAttribute("hext-selector") || ""
          )
        );
      }
    } else {
      for(let key in el.attributes) {
        if (!el.getAttribute(key))
          continue;
        if (key.match(/\s/))
          continue
      }

    }

    // remove any text from the inside of text-containing elements
    clearText(el);

    el.removeAttribute("hext-selected");
  });

  // add to the LCA a root selector for highlighting
  const rootExtractor = "hext-id:hext_id_root ";
  const lcaNode = treeWrapper.childNodes[0];
  lcaNode.setAttribute(
    "hext-selector",
    rootExtractor + (
      lcaNode.getAttribute("hext-selector") || ""
    )
  );

  console.log("Hext-HTML", treeWrapper.innerHTML);

  let matchId = 0;
  const hext = treeWrapper.innerHTML.replaceAll(
    /hext-selector="([^"]+)"/g, (a, n) => {
      if (n == rootExtractor)
        return n;
      return `${n} hext-id:hext_id_highlight`;
    }
  );
  console.log("Hext", hext);
  hext_input.setValue(formatHext(hext));
}

function showElementInfo(el) {
  element_tag.textContent = el.tagName;
  window.EL = el;
  const attrs = [];
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];
    if (attr.name.match(/hext/i))
      continue;
    attrs.push(attr.name);
  }
  element_attrs.textContent = attrs.join(", ");
}

function hideElementInfo() {
  element_tag.textContent = "";
  element_attrs.textContent = "";
}

function elMouseOver(e) {
  e.preventDefault();
  e.stopPropagation();
  e.target.style.boxShadow = HOVER_STYLE;
  e.target.style.cursor = "pointer";
  showElementInfo(e.target);
}

function elMouseOut(e) {
  e.preventDefault();
  e.stopPropagation();
  e.target.style.boxShadow = null;
  e.target.style.cursor = null;
  hideElementInfo();
}

function setElementPadding() {
  setStatus("Adding padding to HTML elements...");
  const iframeDocument = document.querySelector("iframe").contentDocument;
  const style = iframeDocument.getElementById("hext-custom-css");
  const padRule = `* { border: ${PAD_ALL_WIDTH}px solid rgba(0, 0, 0, 0); }`;

  curr_padding.textContent = PAD_ALL_WIDTH;
  // check to see if we've already added this rule (it always gets
  // added as the first rule by insertRule)
  if (style.sheet.rules[0].cssText.startsWith("* { border:")) {
    style.sheet.removeRule(0);
  }
  style.sheet.insertRule(padRule);
}

function iframeLoaded(iframe, e) {
  iframe.style.opacity = null;

  const style = document.createElement("style");
  iframe.contentDocument.head.appendChild(style);
  style.id = "hext-custom-css";
  style.sheet.insertRule(SELECTED_STYLE);
  style.sheet.insertRule(LCA_STYLE);
  style.sheet.insertRule(RESULT_ROOT_STYLE);
  style.sheet.insertRule(RESULT_ITEM_STYLE);

  setElementPadding();

  setStatus("Setting up listeners on the iframe...");
  const iframe_els = iframe.contentDocument.querySelectorAll("*");
  iframe_els.forEach((el) => {
    el.setAttribute("hext-id", uniqueId());
    el.addEventListener("click", elClicked);
    el.addEventListener("mouseover", elMouseOver);
    el.addEventListener("mouseout", elMouseOut);
  });

  setStatus("Page loaded. Use hext, below.");
}

async function loadPage(e) {
  setStatus("Loading webpage...");
  e.preventDefault();
  e.stopPropagation();

  const html = await html_file.files[0].text();

  const existing_iframe = right_pane.querySelector("iframe");
  if (existing_iframe) {
    existing_iframe.remove();
  }

  const iframe = document.createElement("iframe");
  // If we don't use allow-scripts here, we can't highlight
  // anything in Safari
  iframe.setAttribute("sandbox", "allow-same-origin allow-scripts");
  iframe.srcdoc = html;
  iframe.style.opacity = "0.1";
  iframe.onload = iframeLoaded.bind(this, iframe);
  right_pane.prepend(iframe);
}

function unHighlightAll() {
  const iframe = document.querySelector("iframe").contentDocument;
  iframe.querySelectorAll("*").forEach((el) => {
    el.classList.remove("hext-result-root");
    el.classList.remove("hext-result-item");
  });
}

function highlightNodes(iframe, results) {
  setStatus("Highlighting extracted elements...");
  unHighlightAll();

  function markEl(className, el) {
    // don't re-mark nodes we used for creating hext (already highlighted)
    if (el.hasAttribute("hext-lca") || el.hasAttribute("hext-selected"))
      return;
    el.classList.add(className);
  }

  results.forEach((result) => {
    // mark the root wrappers
    iframe
      .querySelectorAll(`[hext-id="${result.hext_id_root}"]`)
      .forEach((el) => {markEl("hext-result-root", el);});

    // mark the individual keys
    for (let key in result) {
      // skip non-hext and the root highlights which we already did
      if (!key.startsWith("hext_id") || key === "hext_id_root") continue;
      // convert to array if it's not, this lets us always handle array
      // based results (all the hext-id extractions use hext_id_highlight)
      const vals = Array.isArray(result[key]) ? result[key] : [result[key]];
      vals.forEach((selector) => {
        iframe
          .querySelectorAll(`[hext-id="${selector}"]`)
          .forEach((el) => {markEl("hext-result-item", el);});
      });
    }
  });
}

/**
 * Take a hext template string and format/indent it
 */
function formatHext(hext) {
  // NOTE: ticks here are workaround to vim highlighting problems
  const chunks = hext.replaceAll(`><`, `>\n<`).split("\n").map((x) => {
    return x;
  });
  let indent = 0;
  let formatted = "";
  for (let i=0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (chunk.startsWith(`</`)) {
      indent -= 2;
      const spaces = [...Array(indent).keys()].map(x=>" ").join("");
      formatted += `${spaces}${chunk}\n`;
    } else {
      const spaces = [...Array(indent).keys()].map(x=>" ").join("");
      formatted += `${spaces}${chunk}\n`;
      indent += 2;
    }
  }
  return formatted;
}

/**
 * Strip out all the hext-id related keys and pretty
 * jsonify the data.
 */
function formatJSON(json) {
  const cleaned = [];
  json.forEach((record) => {
    const cleanRecord = {};
    Object.keys(record).forEach((key) => {
      if (key.startsWith("hext_id")) return;
      cleanRecord[key] = record[key];
    });
    cleaned.push(cleanRecord);
  });
  return JSON.stringify(cleaned, null, 2);
}

async function runHext(e) {
  json_output.setValue("");
  const iframe = document.querySelector("iframe");
  setStatus("Capturing HTML from webpage...");
  const html_src = iframe.contentDocument.documentElement.outerHTML;
  setStatus("Parsing captured HTML...");
  const html = new Html(html_src);
  setStatus("Getting hext template...");
  const hext_src = hext_input.getValue();
  setStatus("Parsing hext template...");
  let rule = null;
  try {
    rule = new Rule(hext_src);
  } catch(e) {
    setStatus(`Hext parse error: ${e}`, true);
    return;
  }
  setStatus("Extracting JSON from HTML using template...");
  const results = rule.extract(html);
  setStatus("Writing results...");
  json_output.setValue(formatJSON(results));

  highlightNodes(iframe.contentDocument, results);
  setStatus(`Extracted ${results.length} records`);
}

function clearResults() {
  unHighlightAll();
  json_output.setValue("");
}

function clearHext() {
  clearResults();
  const iframe = document.querySelector("iframe").contentDocument;
  iframe.querySelectorAll("*").forEach((el) => {
    el.classList.remove("hext-selected");
    el.removeAttribute("hext-selected");
    el.classList.remove("hext-lca");
    el.removeAttribute("hext-lca");
  });
}

function hideDescription(e) {
  e.target.parentNode.style.display = "none";
}

// initializers
loader_form.addEventListener("submit", loadPage);
html_file.addEventListener("change", loadPage);
run_button.addEventListener("click", runHext);
clear_button.addEventListener("click", clearResults);
clear_hext_btn.addEventListener("click", clearHext);
hide_button.addEventListener("click", hideDescription);
inc_padding.addEventListener("click", () => {
  PAD_ALL_WIDTH++;setElementPadding();
});
dec_padding.addEventListener("click", () => {
  PAD_ALL_WIDTH--;setElementPadding();
});
setStatus("Select a file to continue...");
