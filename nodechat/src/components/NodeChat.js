import React, { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useStoreApi,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Menu, Item, useContextMenu } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import UserInputNode from './UserInputNode';
import LLMResponseNode from './LLMResponseNode';
import CustomEdge from './CustomEdge';
import { sendConversationRequest, getConversationHistory } from './Utility';

const nodeTypes = {
  userInput: UserInputNode,
  llmResponse: LLMResponseNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

const MENU_ID = 'node-context-menu';
let currentOverlapOffset = 0;
const OVERLAP_OFFSET = 10;

function NodeChat() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef(null);
  const [message, setMessage] = useState('');
  const store = useStoreApi();
  const reactFlow = useReactFlow();
  const { show } = useContextMenu({
    id: MENU_ID,
  });
  const currentLlmNodeId = useRef(null);

  const onEdgeClick = useCallback((edgeId) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
  }, [setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => eds.concat({ 
      ...params, 
      id: `e${params.source}-${params.target}-${Date.now()}`,
      data: { onEdgeClick },
      type: 'custom' 
    })),
    [onEdgeClick, setEdges]
  );

  const addNode = useCallback((type, sourceNode = null, offset = { x: 0, y: 0 }, text = null, connectToSource = false) => {
    return new Promise((resolve) => {
      const {
        height,
        width,
        transform: [transformX, transformY, zoomLevel]
      } = store.getState();
      const zoomMultiplier = 1 / zoomLevel;
      const centerX = -transformX * zoomMultiplier + (width * zoomMultiplier) / 2;
      const centerY =
        -transformY * zoomMultiplier + (height * zoomMultiplier) / 2;

      let position;
      if (sourceNode) {
        position = {
          x: sourceNode.position.x + offset.x,
          y: sourceNode.position.y + offset.y,
        };
      } else {
        position = {
          x: centerX + currentOverlapOffset,
          y: centerY + currentOverlapOffset
        };
        currentOverlapOffset += OVERLAP_OFFSET;
      }

      position.x = Number(position.x) || 0;
      position.y = Number(position.y) || 0;

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        data: { text: text || (type === 'userInput' ? 'New user input' : 'New LLM response') },
        position: position,
      };

      setNodes((nds) => {
        const updatedNodes = nds.concat(newNode);
        resolve(newNode);
        return updatedNodes;
      });

      if (sourceNode && connectToSource) {
        setEdges((eds) =>
          eds.concat({
            id: `e${sourceNode.id}-${newNode.id}`,
            source: sourceNode.id,
            target: newNode.id,
            data: { onEdgeClick },
            type: 'custom',
          })
        );
      }
    });
  }, [setNodes, setEdges, onEdgeClick, store]);

  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      const pane = reactFlowWrapper.current.getBoundingClientRect();
      show({
        event,
        props: {
          node,
          position: reactFlow.screenToFlowPosition({
            x: event.clientX - pane.left,
            y: event.clientY - pane.top,
          }),
        },
      });
    },
    [show, reactFlow]
  );

  const handleReplicate = useCallback(async ({ props }) => {
    const { node } = props;
    //add a small random offset to the new node
    const newNode = await addNode(node.type, node, { x: 200 + (Math.random()-0.5) * 100, y: (Math.random()-0.5) * 10 }, node.data.text, false);
    
    // Replicate upstream connections
    edges.forEach((edge) => {
      if (edge.target === node.id) {
        setEdges((eds) =>
          eds.concat({
            id: `e${edge.source}-${newNode.id}`,
            source: edge.source,
            target: newNode.id,
            data: { onEdgeClick },
            type: 'custom',
          })
        );
      }
    });
  }, [addNode, edges, onEdgeClick, setEdges]);

  const handleCreateConnectedNode = useCallback(({ props }) => {
    const { node } = props;
    const newType = node.type === 'userInput' ? 'llmResponse' : 'userInput';
    const nodeElement = document.querySelector(`[data-id="${node.id}"]`);
    const nodeHeight = nodeElement ? nodeElement.offsetHeight : 0;
    addNode(newType, node, { x: (Math.random()-0.5) * 100, y: 30 + nodeHeight }, null, true);
  }, [addNode]);

  const setSelectNode = useCallback((node) => {
    setNodes((nds) =>
      nds.map((n) => {
        n.selected = n.id === node.id;
        return n;
      })
    );
  }, [setNodes]);

  const getSelectedNode = useCallback(() => {
    return nodes.find(node => node.selected);
  }, [nodes]);

  const onChunkReceived = useCallback((content) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === currentLlmNodeId.current) {
          return { ...n,
            data: { 
            ...n.data, 
            text: n.data.text + content 
            }};
        }
        return n;
      })
    );
  }, [setNodes]);

  const handleSendMessage = useCallback(async () => {
    if (message.trim() === '') return;

    let selectedNode = getSelectedNode();
    let sourceNode = selectedNode && selectedNode.type === 'llmResponse' ? selectedNode : null;

    let sourceNodeElement = null;
    if (!sourceNode) {
      const latestLLMResponseNode = nodes.filter(node => node.type === 'llmResponse').slice(-1)[0];
      sourceNode = latestLLMResponseNode || null;
    } 
    if (sourceNode) {
      sourceNodeElement = document.querySelector(`[data-id="${sourceNode.id}"]`);
    }
    let sourceNodeHeight = sourceNodeElement ? sourceNodeElement.offsetHeight : 0;

    const userNode = await addNode('userInput', sourceNode, { x: (Math.random()-0.5)*50, y: sourceNodeHeight + 20 }, message, !!sourceNode);
    // Wait for React to update the state
    await new Promise(resolve => setTimeout(resolve, 0));
    const userNodeElement = document.querySelector(`[data-id="${userNode.id}"]`);
    const userNodeHeight = userNodeElement ? userNodeElement.offsetHeight : 0;

    const llmNode = await addNode('llmResponse', userNode, { x: 0, y: userNodeHeight + 20 }, '', true);
    currentLlmNodeId.current = llmNode.id;
    llmNode.data.text = '';
    setMessage('');
    setSelectNode(llmNode);
    await new Promise(resolve => setTimeout(resolve, 0));
    // Get the updated nodes and edges
    const updatedNodes = reactFlow.getNodes();
    const updatedEdges = reactFlow.getEdges();

    let history = getConversationHistory(userNode, updatedNodes, updatedEdges);
    
    try {
      await sendConversationRequest('generate', history, onChunkReceived);
    } catch (error) {
      console.error('Failed to generate response:', error);
      // Handle error (e.g., show error message to user)
    }
  }, [message, getSelectedNode, addNode, setSelectNode, reactFlow, nodes, onChunkReceived]);

  return (
    <div className="h-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onMove={() => {
          currentOverlapOffset = 0;
        }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeContextMenu={onNodeContextMenu}
        selectionMode={SelectionMode.Partial}
        panOnScroll
        selectionOnDrag
        panOnDrag={[1, 2]} // [mouse button, modifier keys]
        fitView
      >
        <Controls position='top-center' orientation='horizontal'/>
        <MiniMap position='top-right' pannable zoomable/>
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
      <div className="absolute top-4 left-4 z-20 flex space-x-2">
        <button 
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={() => {
            addNode('userInput');
            console.log(reactFlow.getNodes());
          }}
        >
          Add User Input
        </button>
        <button 
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => {
            addNode('llmResponse');
          }}
        >
          Add LLM Response
        </button>
      </div>
      <Menu id={MENU_ID}>
        <Item onClick={handleReplicate}>Replicate Node</Item>
        <Item onClick={handleCreateConnectedNode}>Create Connected Node</Item>
      </Menu>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-grow mr-2 p-2 border border-gray-300 rounded"
            placeholder="Type your message here..."
            style={{ maxHeight: '5em', resize: 'none' }}
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default NodeChat;
