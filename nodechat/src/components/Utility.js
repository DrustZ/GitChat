import { getOutgoers, getIncomers } from '@xyflow/react';

export function findAllDescendants(nodeId, nodes, edges) {
  const outgoers = getOutgoers({ id: nodeId }, nodes, edges);
  let descendants = [...outgoers.map(o => o.id)];

  outgoers.forEach((outgoer) => {
    descendants = descendants.concat(findAllDescendants(outgoer.id, nodes, edges));
  });

  return descendants;
}

export function findAllPrecedents(nodeId, nodes, edges) {
  const incomers = getIncomers({ id: nodeId }, nodes, edges);
  let precedents = [...incomers.map(i => i.id)];

  incomers.forEach((incomer) => {
    precedents = precedents.concat(findAllPrecedents(incomer.id, nodes, edges));
  });

  return precedents;
}
