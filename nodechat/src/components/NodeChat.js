import React, { useCallback, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useStoreApi,
} from 'react-flow-renderer';
import { Menu, Item, useContextMenu } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import UserInputNode from './UserInputNode';
import LLMResponseNode from './LLMResponseNode';
import CustomEdge from './CustomEdge';

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
  const store = useStoreApi();
  const { project, getViewport } = useReactFlow();
  const { show } = useContextMenu({
    id: MENU_ID,
  });

  const onConnect = useCallback(
    (params) => setEdges((eds) => eds.concat({ 
      ...params, 
      id: `e${params.source}-${params.target}-${Date.now()}`,
      type: 'custom' 
    })),
    [setEdges]
  );

  const onEdgeClick = useCallback((edgeId) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
  }, [setEdges]);

  const addNode = useCallback((type, sourceNode = null, offset = { x: 0, y: 0 }, text = null, connectToSource = false) => {
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

    setNodes((nds) => nds.concat(newNode));

    if (sourceNode && connectToSource) {
      setEdges((eds) =>
        eds.concat({
          id: `e${sourceNode.id}-${newNode.id}`,
          source: sourceNode.id,
          target: newNode.id,
          type: 'custom',
        })
      );
    }

    return newNode;
  }, [setNodes, setEdges, getViewport]);

  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      const pane = reactFlowWrapper.current.getBoundingClientRect();
      show({
        event,
        props: {
          node,
          position: project({
            x: event.clientX - pane.left,
            y: event.clientY - pane.top,
          }),
        },
      });
    },
    [show, project]
  );

  const handleReplicate = useCallback(({ props }) => {
    const { node } = props;
    const newNode = addNode(node.type, node, { x: 250, y: 0 }, node.data.text, false);
    
    // Replicate upstream connections
    edges.forEach((edge) => {
      if (edge.target === node.id) {
        setEdges((eds) =>
          eds.concat({
            id: `e${edge.source}-${newNode.id}`,
            source: edge.source,
            target: newNode.id,
            type: 'custom',
          })
        );
      }
    });
  }, [addNode, edges, setEdges]);

  const handleCreateConnectedNode = useCallback(({ props }) => {
    const { node } = props;
    const newType = node.type === 'userInput' ? 'llmResponse' : 'userInput';
    addNode(newType, node, { x: 0, y: 150 }, null, true);
  }, [addNode]);

  return (
    <div className="h-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges.map(edge => ({ 
          ...edge, 
          data: { onEdgeClick },
          key: edge.id
        }))}
        onMove={() => {
          // Purely for example's sake
          currentOverlapOffset = 0;
        }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeContextMenu={onNodeContextMenu}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
      <div className="absolute top-4 left-4 z-10 flex space-x-2">
        <button 
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={() => addNode('userInput')}
        >
          Add User Input
        </button>
        <button 
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => addNode('llmResponse')}
        >
          Add LLM Response
        </button>
      </div>
      <Menu id={MENU_ID}>
        <Item onClick={handleReplicate}>Replicate Node</Item>
        <Item onClick={handleCreateConnectedNode}>Create Connected Node</Item>
      </Menu>
    </div>
  );
}

export default NodeChat;