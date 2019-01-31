import $ from 'jquery';

import constants from 'js/constants';

const requiredAttr = "autoscrape-required";

const html2hext = (html) => {
  console.log("HTML", html);
  const parsed = $.parseHTML(html); //.cloneNode();
  if (parsed.length !== 1) {
    console.error("Cannot build a Hext template without a single root node");
    return;
  }
  const root = parsed[0];
  let output = "";

  const selectedNodes = $(parsed).find(`.${constants.selectedClass}`);

  selectedNodes.each((_, node) => {
    while(node.parentNode) {
      $(node).attr(requiredAttr, "1");
      node = node.parentNode;
    }
  });

  let colN = 1;
  const transform = (node) => {
    if (!node) return console.error("Node missing.");
    if (!node.attributes.getNamedItem(requiredAttr)) {
      return;
    }

    // build selector
    let selectors = [];
    if (node.classList.contains(constants.selectedClass)) {
      const customLabel = node.getAttribute(constants.labelAttr);
      const label = customLabel || `CONTENT-${colN++}`;
      selectors.push(`@text:${label}`);
      switch (node.tagName) {
        case "IMG":
          if (node.getAttribute("src")) {
            selectors.push(`src:${label}-image-link`);
          }
          break;
        case "A":
          if (node.getAttribute("href")) {
            selectors.push(`href:${label}-link`);
          }
          break;
        default:
          break;
      }
    }

    const selectorStr = selectors.join(" ");
    let nthChild = "";
    if (node.parentElement) {
      const siblings = node.parentElement.children;
      let index = -1;
      for (let i = 0; i < siblings.length; ++i)
         if (siblings[i] === node)
          index = i;
      nthChild = `:nth-child(${index + 1})`;
    }

    let children = node.children;
    if (children.length === 0) {
      // write opening & closing tag w/ selectors
      output += `<${node.tagName}${nthChild} ${selectorStr} />`;
    }
    else {
      // write opening tag w/ selectors
      output += `<${node.tagName}${nthChild} ${selectorStr}>`;
      for (const i in children) {
        if (children.hasOwnProperty(i)) {
          const child = children[i];
          transform(child, output);
        }
      }
      // write closing tag
      output += `</${node.tagName}>`;
    }

  };

  transform(root);
  console.log("hext", output);
  return output;
};

/**
 * Convert an HTML chunk, with selected classes attached, into
 * a hext template where the selected nodes are extracted.
 *
 * NOTE: This is an old version of the algorithm which will
 * fail when large swaths of the DOM end up in the Hext
 * template.
 */
const html2hextNaive= (html) => {
  const parsed = $.parseHTML(html);
  if (parsed.length !== 1) {
    console.error("Cannot build a Hext template without a single root node");
    return;
  }
  const root = parsed[0];

  let output = "";

  /**
   * Recursive plan:
   * 1) check if element has selected class
   *   a) yes: build a @text:COL[N], href if a, src if img
   * 2) remove all attributes from element
   * 3) check for children nodes
   *   a) yes:
   *     i) write opening tag w/ optional extractor
   *     ii) recurse into children node in a loop
   *     iii) write closing tag
   *   b) no: write full tag w/ optional extractor
   */
  let colN = 1;
  const transform = (node) => {
    if (!node) return console.error("Node missing.");

    // build selector
    let selectors = [];
    if (node.classList.contains(constants.selectedClass)) {
      const customLabel = node.getAttribute(constants.labelAttr);
      const label = customLabel || `CONTENT-${colN++}`;
      selectors.push(`@text:${label}`);
      switch (node.tagName) {
        case "IMG":
          if (node.getAttribute("src")) {
            selectors.push(`src:${label}-image-link`);
          }
          break;
        case "A":
          if (node.getAttribute("href")) {
            selectors.push(`href:${label}-link`);
          }
          break;
        default:
          break;
      }
    }

    const selectorStr = selectors.join(" ");

    /*
    // remove attributes
    for (let i in node.attributes) {
      // TODO: use the classes in the construction of hext templates so
      // that means we can't remove them here. in fact we don't really
      // need to do this here at all for now
      if (node.hasOwnProperty(i) && i !== constants.labelAttr) {
        const name = node.attributes[i].name;
        node.removeAttribute(name);
      }
    }
    */

    let children = node.children;
    if (children.length === 0) {
      // write opening & closing tag w/ selectors
      output += `<${node.tagName} ${selectorStr} />`;
    }
    else {
      // write opening tag w/ selectors
      output += `<${node.tagName} ${selectorStr}>`;
      for (const i in children) {
        if (children.hasOwnProperty(i)) {
          const child = children[i];
          transform(child, output);
        }
      }
      // write closing tag
      output += `</${node.tagName}>`;
    }

  };

  transform(root);
  return output;
};

export default html2hext;
