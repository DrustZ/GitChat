import React from 'react';
import { getBezierPath } from '@xyflow/react';

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
        d={edgePath[0]}
      />
      <path
        style={{
          strokeWidth: 20,
          stroke: 'transparent',
          fill: 'none',
          cursor: 'pointer',
        }}
        d={edgePath[0]}
        onClick={() => data.onEdgeClick(id)}
      />
    </>
  );
};

export default CustomEdge;