import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, useReactFlow, NodeResizer } from '@xyflow/react';

const UserInputNode = ({ id, data }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text);
  const { setNodes } = useReactFlow();
  const textareaRef = useRef(null);
  const wrapperRef = useRef(null);

  const onDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((n) => n.id !== id));
  }, [id, setNodes]);

  const onTextChange = useCallback((evt) => {
    setText(evt.target.value);
  }, []);

  const onTextBlur = useCallback(() => {
    setIsEditing(false);
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          node.data = { ...node.data, text };
        }
        return node;
      })
    );
  }, [id, setNodes, text]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const updateSize = useCallback(() => {
    if (textareaRef.current && wrapperRef.current) {
      const textareaHeight = textareaRef.current.scrollHeight;
      wrapperRef.current.style.height = `${textareaHeight + 60}px`; // Add padding
      wrapperRef.current.style.width = `${textareaRef.current.offsetWidth + 32}px`; // Add padding
    }
  }, []);

  useEffect(() => {
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [updateSize]);

  useEffect(() => {
    updateSize();
  }, [text, isEditing, updateSize]);

  const commonTextareaStyles = `
    w-full p-2 text-gray-700 border rounded
    overflow-hidden whitespace-pre-wrap break-words
    focus:outline-none focus:ring-2 focus:ring-blue-500
    nodrag
  `;

  return (
    <div ref={wrapperRef} className="relative">
      <div className="absolute inset-0 px-4 py-2 shadow-md rounded-md bg-green-100 border-2 border-green-300">
        <Handle 
          type="target" 
          position={Position.Top} 
          className="!w-3 !h-3 !bg-teal-500" 
          style={{ top: -10 }}
        />
        <div className="font-bold text-sm text-green-700 mb-2">User Input</div>
        <textarea
          ref={textareaRef}
          className={`${commonTextareaStyles} ${isEditing ? 'nopan nowheel resize' : 'bg-transparent resize-none'}`}
          value={text}
          onChange={onTextChange}
          onBlur={onTextBlur}
          readOnly={!isEditing}
          onDoubleClick={handleDoubleClick}
          style={{ 
            height: 'auto',
            minWidth: '10em',
            maxHeight: isEditing ? '30em' : 'none',
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
          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
          onClick={onDelete}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default memo(UserInputNode);