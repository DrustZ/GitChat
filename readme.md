# GitChat

- Ever got frustrated when revising a chat history with LLM, the whole follow-ups got disappeared? 

- Ever tried to merge different threads with LLM into to one, so you copy-pasted all chats into a new chat to have better context?

- Ever wondered "what if I can have multiple response with different input, and compare them", but bothered that the current chat interface is too linear?

Try out Gitchat! It loosly applies the git concept - you can merge, branch and modify the chat history. By treating messages as interconnected nodes in a flowchart-like structure. 

It offers unprecedented flexibility in Large Language Model (LLM) interactions, allowing users to create branches, merge conversations, and rewire chat histories.

## Features

1. **Non-linear Conversation Presentation**
   - Visualize conversations as nodes and edges in a flowchart structure
   - Easily manage and manipulate conversation context

2. **Context Replication**
   - Create new conversation branches by replicating existing nodes
   - Avoid the need to copy/paste entire conversations as in traditional LLM interfaces

3. **Flexible Context Management**
   - Route or unroute different conversation branches when creating new chats
   - Easily control the context provided to the LLM for each interaction

4. **Editable Conversation History**
   - Delete or modify LLM responses and user inputs
   - Regenerate responses based on edited content

5. **Cascade-style Response Regeneration**
   - Automatically regenerate all child LLM responses when modifying an earlier user input
   - Maintain conversation coherence without resetting the entire thread

6. **Interactive Node Management**
   - Add new user input or LLM response nodes
   - Connect nodes to create new conversation flows

7. **Context Menu Operations**
   - Replicate nodes to create parallel conversation branches
   - Create connected nodes to extend conversations

8. **Responsive Layout**
   - Zoom and pan functionality for easy navigation
   - Minimap for an overview of the conversation structure

## Getting Started

### Prerequisites

- Node.js (version 14 or later)
- npm (usually comes with Node.js)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/DrustZ/GitChat
   ```

2. Navigate to the project directory:
   ```
   cd GitChat
   ```

3. For the webapp, install dependencies:
   ```
   cd nodechat
   npm install
   ```

4. Start the webapp:
   ```
   npm start
   ```

5. Do it again for the server (remember to create a .env for your openai key `OPENAI_API_KEY = `):
   ```
   cd server
   npm install
   npm start
   ```

5. Open your browser and visit `http://localhost:3000` to see the application.

## Usage

1. **Adding Nodes**: 
   - Click the "Add User Input" or "Add LLM Response" buttons to create new nodes.
   - Type your message in the input field at the bottom and click "Send" to add a new user input followed by an LLM response.

2. **Editing Nodes**: 
   - Double-click on a node to edit its content.

3. **Creating Connections**: 
   - Drag from the bottom handle of one node to the top handle of another to create a connection.

4. **Replicating Nodes**: 
   - Right-click on a node and select "Replicate Node" from the context menu.

5. **Creating Connected Nodes**: 
   - Right-click on a node and select "Create Connected Node" to add a new node connected to the selected one.

6. **Deleting Connections**: 
   - Click on a connection to delete it.

7. **Regenerating Responses**: 
   - Edit a user input node and all subsequent LLM response nodes will automatically regenerate.

8. **Navigation**: 
   - Use the mouse wheel to zoom in and out.
   - Click and drag on the background to pan the view.
   - Use the minimap in the top-right corner for quick navigation.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments
- Non-linear chat idea inspired by the [Sensecape](https://dl.acm.org/doi/10.1145/3586183.3606756) project. Check out their [video](https://www.youtube.com/watch?v=MIfhunAwZew)!

- Also, got inspiration from discussion with [Xingyu Bruce Liu](https://liubruce.me/)

- This project uses [React Flow](https://reactflow.dev/) for the flowchart functionality.


