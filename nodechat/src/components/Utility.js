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

export function getConversationHistory(node, nodes, edges) {
  const history = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  function processNode(currentNode) {
    if (!currentNode) return;

    const nodeHistory = {
      id: currentNode.id,
      role: currentNode.type === 'userInput' ? 'user' : 'llm',
      parent: [],
      content: currentNode.data.text,
      children: []
    };

    // Find parent nodes
    const incomers = getIncomers({ id: currentNode.id }, nodes, edges);
    nodeHistory.parent = incomers.map(incomer => incomer.id);

    if (node != currentNode) {
      // Find child nodes
      const outgoers = getOutgoers({ id: currentNode.id }, nodes, edges);
      nodeHistory.children = outgoers.map(outgoer => outgoer.id);
    }
    history.unshift(nodeHistory);

    // Process parent nodes recursively
    incomers.forEach(incomer => processNode(nodeMap.get(incomer.id)));
  }

  // Start processing from the given node
  processNode(node);

  return history;
}
