import React from 'react';
import { getBezierPath } from 'react-flow-renderer';

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
}) => {
  const edgePath = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: 3,
          stroke: '#bbb',
        }}
        className="react-flow__edge-path"
        d={edgePath}
      />
      <path
        style={{
          strokeWidth: 20,
          stroke: 'transparent',
          fill: 'none',
          cursor: 'pointer',
        }}
        d={edgePath}
        onClick={() => data.onEdgeClick(id)}
      />
    </>
  );
};

export default CustomEdge;