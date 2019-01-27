import $ from 'jquery';

import constants from 'js/constants';

/**
 * Convert an HTML chunk, with selected classes attached, into
 * a hext template where the selected nodes are extracted.
 */
const html2hext = (html) => {
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
