/**
 * Get the absolute depth of a element, from its target
 * property. This doesn't differentiate between equal depth
 * nodes from different branches.
 */
const getDepth = (target) => {
  let parent = target.parentNode;
  let depth = 0;
  while (parent !== null) {
    depth++;
    parent = parent.parentNode;
  }
  return depth;
};

/**
 * Get the lowest common ancestor (LCA), as an Element, of a
 * set of element nodes. Note that this is *not* an optimal
 * LCA algorithm.
 */
const getLCA = (nodes) => {
  const depthNodes = {};
  let lowest = null;

  if (nodes.length === 1) {
    return nodes[0].target.parentNode;
  }

  // get the depth of each node
  console.log("Finding depths");
  for (const nodeIx in nodes) {
    const node = nodes[nodeIx];
    const depth = getDepth(node.target);
    if (depthNodes[depth] === undefined) {
      depthNodes[depth] = [];
    }
    depthNodes[depth].push(node);
    if (lowest === null || lowest > depth) {
      lowest = depth;
    }
    console.log("nodeIx", nodeIx, "depth", depth);
  }

  // find the parent node of each depth node and
  // loop until every node has a parent node of
  // the same height
  console.log("Finding depth parents");
  let eqDepthParents = [];
  for (const depth in depthNodes) {
    for (const nIx in depthNodes[depth]) {
      let parentNode = depthNodes[depth][nIx].target.parentNode;
      if (depth == lowest) {
        eqDepthParents.push(parentNode);
      }
      else {
        let i = depth;
        for (; i > lowest; i--) {
          console.log("crawling. i", i);
          parentNode = parentNode.parentNode;
        }
        eqDepthParents.push(parentNode);
      }
      console.log("depth", depth, "nIx", nIx);
    }
  }

  // now that all the nodes have a parent of the same height,
  // check to see if the common-height parent is the
  // same parent for all, if yes, return it
  // if it's not, go up another level and see if those
  // are all the same, continue until this it true
  let pDepth = lowest;
  console.log("Checking common parent depth");
  while (pDepth > 0) {
    const allEqual = eqDepthParents.every((v, i, a) => {
      console.log("checking eq", v, i, a);
      return v === a[0];
    });
    console.log("allEqual", allEqual, "eqDepthParents", eqDepthParents);
    console.log();
    if (allEqual) {
      console.log("All equal, returning", eqDepthParents[0]);
      return eqDepthParents[0];
    }
    pDepth--;
    const nextParents = [];
    for (nIx in eqDepthParents) {
      const node = eqDepthParents[nIx];
      nextParents.push(node.parentNode);
    }
    eqDepthParents = nextParents;
  }

  // we found no solution!
  return null;
};

