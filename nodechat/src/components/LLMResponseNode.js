import React, { memo, useRef, useEffect, useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

const LLMResponseNode = (props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(props.data.text);
  const { setNodes } = useReactFlow();
  const textareaRef = useRef(null);

  useEffect(() => { 
    setText(props.data.text);
    }, [props]);

  const onTextChange = useCallback((evt) => {
    setText(evt.target.value);
  }, []);

  const onTextBlur = useCallback(() => {
    setIsEditing(false);
    setNodes((nodes) => 
      nodes.map((node) => {
        if (node.id === props.id) {
          node.data = { ...node.data, text };
        }
        return node;
      })
    );
  }, [props, setNodes, text]);

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
    <div className={`px-4 py-2 shadow-md rounded-md bg-blue-100 border-2 ${props.selected ? 'border-blue-500' : 'border-blue-200'} relative`}>
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
            className="text-gray-700 cursor-text nopan nodrag"
            style={{ userSelect: 'text' }}
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
      </div>
  );
};

export default memo(LLMResponseNode);