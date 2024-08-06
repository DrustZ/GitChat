import { getOutgoers, getIncomers } from '@xyflow/react';

export async function sendConversationRequest(endpoint, conversation, onChunkReceived) {
  try {
    // Make the POST request and handle streaming response
    const response = await fetch(`http://localhost:8000/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversation }),
    });

    if (!response.ok) {
      throw new Error('Failed to start conversation');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let buffer = '';

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;

      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const chunk = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        if (chunk.startsWith('data: ')) {
          const data = JSON.parse(chunk.slice(6));
          if (data.content === '[DONE]') {
            return;
          } else {
            onChunkReceived(data.content);
          }
        }

        boundary = buffer.indexOf('\n\n');
      }
    }
  } catch (error) {
    console.error('Failed to send conversation request:', error);
    throw error;
  }
}

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
      role: currentNode.type === 'userInput' ? 'user' : 'assistant',
      parent: [],
      content: currentNode.data.text,
      children: []
    };

    // Find parent nodes
    const incomers = getIncomers({ id: currentNode.id }, nodes, edges);
    nodeHistory.parent = incomers.map(incomer => incomer.id);

    if (node.id !== currentNode.id) {
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
