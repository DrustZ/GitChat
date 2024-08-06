import React, { memo, useRef, useEffect, useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

const LLMResponseNode = (props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(props.data.text);
  const [isFolded, setIsFolded] = useState(true);
  const [isFoldable, setIsFoldable] = useState(false);
  const { setNodes } = useReactFlow();
  const textareaRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (props.data.text !== text) {
      setText(props.data.text);
    }
  }, [props.data.text]);

  useEffect(() => {
    if (contentRef.current) {
      setIsFoldable(contentRef.current.scrollHeight > 160); // Set the foldable height limit (e.g., 160px)
    }
  }, [text, isEditing]);

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
    if (contentRef.current) {
        const divWidth = contentRef.current.offsetWidth;
        setIsEditing(true);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.style.width = `${divWidth}px`;
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
          }
        }, 0);
      }
  }, []);

  const toggleFold = () => {
    setIsFolded(!isFolded);
  };

  return (
    <div
      className={`px-4 py-2 shadow-md rounded-md bg-blue-100 border-2 ${
        props.selected ? 'border-blue-500' : 'border-blue-200'
      } relative`}
      style={{ 
        maxWidth: isFolded ? '25em' : '35em',
     }}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-blue-500" />
      <div className="font-bold text-sm text-blue-700 flex justify-between">
        LLM Response
        {isFoldable && (
          <button onClick={toggleFold} className="text-xs text-blue-500">
            {isFolded ? 'Expand' : 'Fold'}
          </button>
        )}
      </div>
      {isEditing ? (
        <textarea
          ref={textareaRef}
          className="w-full p-2 text-gray-700 border rounded min-h-[50px] nodrag nopan nowheel resize" 
          value={text}
          style={{ 
            minWidth: '10em',
            maxHeight: isFolded ? '10em' : '30em',
            width: 'auto',
        }}
          onChange={onTextChange}
          onBlur={onTextBlur}
          autoFocus
        />
      ) : (
        <div
          ref={contentRef}
          className={`text-gray-700 cursor-text nopan nodrag ${isFolded ? 'nowheel' : ''}`}
          style={{
            userSelect: 'text',
            maxHeight: isFolded ? '10em' : 'none',
            overflow: isFolded ? 'auto' : 'visible'
          }}
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
              }
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
