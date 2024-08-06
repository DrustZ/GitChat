import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, useReactFlow, getOutgoers } from '@xyflow/react';
import { getConversationHistory, sendConversationRequest, findAllDescendants } from './Utility';

const UserInputNode = (props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(props.data.text);
  const [isFolded, setIsFolded] = useState(false);
  const [isFoldable, setIsFoldable] = useState(false);
  const reactFlow = useReactFlow();
  const textareaRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (props.data.text !== text) {
      setText(props.data.text);
    }
  }, [props.data.text]);

  useEffect(() => {
    if (textareaRef.current) {
      setIsFoldable(textareaRef.current.scrollHeight > 160); // Set the foldable height limit (e.g., 160px)
    }
  }, [text, isEditing]);

  const onChunkReceived = useCallback((content, nodeId) => {
    reactFlow.setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          return { ...n,
            data: { 
            ...n.data, 
            text: n.data.text + content 
            }};
        }
        return n;
      })
    );
  }, [reactFlow]);

  const regenerateNode = useCallback(async (node) => {
    const nodes = reactFlow.getNodes();
    const edges = reactFlow.getEdges();
    const history = getConversationHistory(node, nodes, edges);

    try {
      await sendConversationRequest('generate', history, (content) => onChunkReceived(content, node.id));
    } catch (error) {
      console.error('Failed to generate response:', error);
    }
  }, [reactFlow, onChunkReceived]);

  const onRegenerate = useCallback(async () => {
    const nodes = reactFlow.getNodes();
    const edges = reactFlow.getEdges();
    const userNode = reactFlow.getNode(props.id);
    const outgoers = getOutgoers(userNode, nodes, edges);

    // If no LLM response node, create one
    if (outgoers.length === 0) {
      const llmNode = {
        id: `llmResponse-${Date.now()}`,
        type: 'llmResponse',
        data: { text: '' },
        position: { x: userNode.position.x, y: userNode.position.y + 150 },
      };

      reactFlow.addNodes(llmNode);
      const edgeId = `e${userNode.id}-${llmNode.id}`;
      reactFlow.addEdges({
        id: edgeId,
        source: userNode.id,
        target: llmNode.id,
        data: { onEdgeClick: () => reactFlow.deleteElements({ edges: [{ id: edgeId }] })},
        type: 'custom',
      });

      // Wait for React to update the state
      await new Promise(resolve => setTimeout(resolve, 0));
      await regenerateNode(llmNode);
      return;
    }

    // Regenerate all descendants
    const descendants = findAllDescendants(userNode.id, nodes, edges);
    for (const descendantId of descendants) {
      const descendantNode = nodes.find(n => n.id === descendantId);
      if (descendantNode.type === 'llmResponse') {
        descendantNode.data.text = ''; // Clear the previous text
        await regenerateNode(descendantNode);
      }
    }
  }, [props.id, reactFlow, regenerateNode]);

  const onTextChange = useCallback((evt) => {
    setText(evt.target.value);
  }, []);

  const onTextBlur = useCallback(() => {
    setIsEditing(false);
    reactFlow.setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === props.id) {
          node.data = { ...node.data, text: text };
        }
        return node;
      })
    );
    updateSize();
  }, [props.id, reactFlow, text]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
    }, 100);
  }, []);

  const toggleFold = () => {
    setIsFolded(!isFolded);
  };

  const updateSize = useCallback(() => {
    if (textareaRef.current && wrapperRef.current) {
      const tempSpan = document.createElement('span');
      tempSpan.style.visibility = 'hidden';
      tempSpan.style.position = 'absolute';
      tempSpan.style.whiteSpace = 'pre-wrap';
      tempSpan.style.width = textareaRef.current.style.width; // Use the user-specified width

      tempSpan.innerText = textareaRef.current.value;
  
      document.body.appendChild(tempSpan);
  
      const fontSize = parseFloat(getComputedStyle(textareaRef.current).fontSize);
      const maxTextareaWidthPx = (isFolded ? 15 : 35) * fontSize; // Convert 35em to px based on the current font size
      const textareaWidthPx = Math.min(tempSpan.offsetWidth + 20, maxTextareaWidthPx); // Set max width to 35em
      document.body.removeChild(tempSpan);
  
      const adjustedWidthPx = Math.min(textareaRef.current.offsetWidth, textareaWidthPx);
      const adjustedWidthEm = adjustedWidthPx / fontSize;
  
      textareaRef.current.style.width = `${adjustedWidthEm}em`;
      textareaRef.current.style.height = 'auto'; // Reset height to auto to recalculate based on content
      const textareaHeightPx = textareaRef.current.scrollHeight;
      const textareaHeightEm = textareaHeightPx / fontSize;
      textareaRef.current.style.height = `${textareaHeightEm}em`;
  
      const wrapperHeightEm = isFolded ? 15 : (textareaHeightPx + 60) / fontSize; // Update height based on folded state and convert to em
  
      wrapperRef.current.style.width = `${Math.max(adjustedWidthEm + 2, 12)}em`;
      wrapperRef.current.style.height = `${wrapperHeightEm}em`;
    }
  }, [isFolded]);
  
  useEffect(() => {
    if (textareaRef.current) {
      const tempSpan = document.createElement('span');
      tempSpan.style.visibility = 'hidden';
      tempSpan.style.position = 'absolute';
      tempSpan.style.whiteSpace = 'pre-wrap';
      tempSpan.style.width = 'auto'; // Calculate width based on text content
      tempSpan.innerText = textareaRef.current.value;
  
      document.body.appendChild(tempSpan);
  
      const fontSize = parseFloat(getComputedStyle(textareaRef.current).fontSize);
      const minTextareaWidthPx = 10 * fontSize; // Convert 10em to px
      const maxTextareaWidthPx = 35 * fontSize; // Convert 35em to px based on the current font size
      const textareaWidthPx = Math.min(Math.max(tempSpan.offsetWidth + 20, minTextareaWidthPx), maxTextareaWidthPx); // Set width between 10em and 35em
      document.body.removeChild(tempSpan);
  
      const adjustedWidthEm = textareaWidthPx / fontSize;
      textareaRef.current.style.width = `${adjustedWidthEm}em`;
    }
  
    updateSize(); // Set the initial size based on content
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [updateSize]);
  
  useEffect(() => {
    updateSize();
  }, [text, isEditing, isFolded, updateSize]); // Add isFolded to the dependency array
  

  const commonTextareaStyles = `
    w-full p-2 text-gray-700 border rounded
    overflow-hidden whitespace-pre-wrap break-words
    focus:outline-none focus:ring-2 focus:ring-blue-500
    nodrag
  `;

  return (
    <div ref={wrapperRef} className="relative">
      <div className={`absolute inset-0 px-4 py-2 shadow-md rounded-md bg-green-100 border-2  ${props.selected ? 'border-green-500' : 'border-green-200'}`}>
        <Handle 
          type="target" 
          position={Position.Top} 
          className="!w-3 !h-3 !bg-teal-500" 
          style={{ top: -10 }}
        />
        <div className="font-bold text-sm text-green-700 mb-2 flex justify-between">
          User Input
          {isFoldable && (
            <button onClick={toggleFold} className="text-xs text-green-500">
              {isFolded ? 'Expand' : 'Fold'}
            </button>
          )}
        </div>
        <textarea
          ref={textareaRef}
          className={`${commonTextareaStyles} ${isEditing ? 'nopan nowheel resize' : 'bg-transparent resize-none'} ${isFolded ? 'nowheel' : ''}`}
          value={text}
          onChange={onTextChange}
          onBlur={onTextBlur}
          readOnly={!isEditing}
          onDoubleClick={handleDoubleClick}
          style={{ 
            width: 'auto', // Initially set width based on content
            height: 'auto',
            minWidth: '10em',
            maxWidth: '35em', // Set max width
            maxHeight: isFolded ? '12em' : 'none',
            overflow: isFolded ? 'auto' : 'visible',
            cursor: isEditing ? 'text' : 'default'
          }}
        />
        <Handle 
          type="source" 
          position={Position.Bottom} 
          className="!w-3 !h-3 !bg-teal-500" 
          style={{ bottom: -10 }}
        />
        <button
          className="absolute top-0 right-0 bg-green-300 text-white rounded-full w-5 h-5 flex items-center justify-center"
          onClick={onRegenerate}
        >
          ♻️
        </button>
      </div>
    </div>
  );
};

export default memo(UserInputNode);
