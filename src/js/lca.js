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
const findLCA = (nodes) => {
  const depthNodes = {};
  let lowest = null;

  if (nodes.length === 1) {
    return nodes[0].parentNode;
  }

  // get the depth of each node
  for (const nodeIx in nodes) {
    const node = nodes[nodeIx];
    const depth = getDepth(node);
    if (depthNodes[depth] === undefined) {
      depthNodes[depth] = [];
    }
    depthNodes[depth].push(node);
    if (lowest === null || lowest > depth) {
      lowest = depth;
    }
  }

  // find the parent node of each depth node and
  // loop until every node has a parent node of
  // the same height
  let eqDepthParents = [];
  for (const depth in depthNodes) {
    for (const nIx in depthNodes[depth]) {
      let parentNode = depthNodes[depth][nIx].parentNode;
      if (depth == lowest) {
        eqDepthParents.push(parentNode);
      }
      else {
        let i = depth;
        for (; i > lowest; i--) {
          parentNode = parentNode.parentNode;
        }
        eqDepthParents.push(parentNode);
      }
    }
  }

  // now that all the nodes have a parent of the same height,
  // check to see if the common-height parent is the
  // same parent for all, if yes, return it
  // if it's not, go up another level and see if those
  // are all the same, continue until this it true
  let pDepth = lowest;
  while (pDepth > 0) {
    const allEqual = eqDepthParents.every((v, i, a) => {
      return v === a[0];
    });
    if (allEqual) {
      return eqDepthParents[0];
    }
    pDepth--;
    const nextParents = [];
    for (const nIx in eqDepthParents) {
      const node = eqDepthParents[nIx];
      nextParents.push(node.parentNode);
    }
    eqDepthParents = nextParents;
  }

  // we found no solution!
  return null;
};

export default findLCA;
