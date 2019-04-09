import $ from 'jquery';

import constants from 'js/constants';

const requiredAttr = "hextractor-required";

/**
 * Take a block of HTML, contained by the Lowest Common
 * Ancestor of a group of selected elements, and return a
 * Hext extraction template.
 *
 * Note that the HTML block has been annotated by the
 * extractor JavaScript to indicate specific things be
 * done. For example, a node can be selected, but also be
 * annotated to be an optional selector. Other annotations
 * are label name.
 */
const html2hext = (html) => {
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
  const transform = (node, optionalPath) => {
    if (!node) return console.error("Node missing.");
    if (!node.attributes.getNamedItem(requiredAttr)) {
      return;
    }

    // Check for our modifier attributes
    const isSelected = node.classList.contains(constants.selectedClass);
    const isOpt = node.classList.contains(constants.optionalClass);
    const selectLike = node.classList.contains(constants.selectLikeClass);

    // build selector
    let selectors = [];
    if (isSelected) {
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
    if (node.parentElement && !selectLike) {
      const siblings = node.parentElement.children;
      let index = -1;
      for (let i = 0; i < siblings.length; ++i) {
        if (siblings[i] === node) {
          index = i;
        }
      }
      nthChild = `:nth-child(${index + 1})`;
    }
    else if (selectLike) {
      nthChild = ":nth-child(1n)";
    }

    let children = node.children || [];
    // if user tagged this as optional, prepend tag with annotation
    let opt = "";
    if (isOpt || optionalPath) {
      opt =  "?";
    }
    // write opening tag w/ selectors
    output += `<${opt}${node.tagName}${nthChild} ${selectorStr}>`;
    for (const i in children) {
      if (children.hasOwnProperty(i)) {
        const child = children[i];
        transform(child, isOpt||optionalPath);
      }
    }
    // write closing tag
    output += `</${node.tagName}>`;
  };

  transform(root);
  return output;
};

export default html2hext;
