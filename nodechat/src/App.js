import React from 'react';
import { ReactFlowProvider } from 'react-flow-renderer';
import NodeChat from './components/NodeChat';

function App() {
  return (
    <div className="App h-screen">
      <ReactFlowProvider>
        <NodeChat />
      </ReactFlowProvider>
    </div>
  );
}

export default App;