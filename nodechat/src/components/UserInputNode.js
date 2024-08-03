import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, useReactFlow } from 'react-flow-renderer';

const UserInputNode = ({ id, data }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text);
  const [textareaHeight, setTextareaHeight] = useState('auto');
  const { setNodes } = useReactFlow();
  const textareaRef = useRef(null);

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

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing, text]);

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-green-100 border-2 border-green-300 relative">
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-teal-500" 
        style={{ top: -10 }}
      />
      <div className="font-bold text-sm text-green-700">User Input</div>
      {isEditing ? (
        <textarea
          ref={textareaRef}
          className="w-full p-2 text-gray-700 border rounded resize-y min-h-[50px]"
          value={text}
          onChange={onTextChange}
          onBlur={onTextBlur}
          autoFocus
          style={{ height: textareaHeight }}
        />
      ) : (
        <div 
          className="text-gray-700 cursor-text" 
          onDoubleClick={handleDoubleClick}
        >
          {text}
        </div>
      )}
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
  );
};

export default memo(UserInputNode);