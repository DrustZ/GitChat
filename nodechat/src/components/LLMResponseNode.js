import React, { memo, useRef, useEffect, useState, useCallback } from 'react';
import { Handle, Position, useReactFlow, NodeResizer } from '@xyflow/react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

const LLMResponseNode = ({ id, data }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text);
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
    <>
      <NodeResizer minWidth={100} minHeight={30} />
      <div className="px-4 py-2 shadow-md rounded-md bg-blue-100 border-2 border-blue-300 relative">
        <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-blue-500" />
        <div className="font-bold text-sm text-blue-700">LLM Response</div>
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className="w-full p-2 text-gray-700 border rounded min-h-[50px] nodrag nopan nowheel resize"
            value={text}
            style={{ maxHeight: '30em' }} 
            onChange={onTextChange}
            onBlur={onTextBlur}
            autoFocus
          />
        ) : (
          <div 
            className="text-gray-700 cursor-text nopan" 
            onDoubleClick={handleDoubleClick}
          >
            <ReactMarkdown 
              className="markdown"
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={okaidia}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {text}
            </ReactMarkdown>
          </div>
        )}
        <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-blue-500" />
        <button
          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
          onClick={onDelete}
        >
          ×
        </button>
      </div>
    </>
  );
};

export default memo(LLMResponseNode);