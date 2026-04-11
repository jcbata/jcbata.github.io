# Ollama Web UI Service

This project provides a simple Node.js web service with a responsive frontend to interact with a local Ollama instance. It allows users to experiment with Ollama's text generation and chat capabilities through a user-friendly web interface.

## Features

*   **Backend (Node.js/Express):**
    *   Proxies requests to the local Ollama API (`http://localhost:11434`).
    *   Supports streaming responses for real-time text generation and chat.
    *   Exposes endpoints for listing models, generating text, and engaging in chat conversations.
*   **Frontend (HTML/CSS/JavaScript with Bootstrap 5):**
    *   **Responsive Design:** Adapts to mobile, tablet, and desktop screens.
    *   **Tabbed Interface:** Separates "Chat" and "Generate Text" functionalities.
    *   **Chat History:** Displays conversational history in a WhatsApp-like format.
    *   **Model Selection:** Allows users to select from locally available Ollama models.
    *   **Configurable Parameters:** Provides controls for `Temperature`, `Max Tokens` (`num_predict`), and `Enable Thinking`.
    *   **Thinking Process Display:** When "Enable Thinking" is active, the model's internal thought process is displayed in the chat.
    *   **Loading Indicators:** Visual feedback during API calls.

## Prerequisites

Before running this application, ensure you have the following installed:

*   **Node.js:** [Download & Install Node.js](https://nodejs.org/)
*   **Ollama:** [Download & Install Ollama](https://ollama.ai/download)
*   **An Ollama Model:** Pull at least one model using the Ollama CLI (e.g., `ollama pull llama2` or `ollama pull gemma:2b`).

## Installation

1.  **Clone this repository** (if you haven't already).
2.  **Navigate to the project directory:**
    ```bash
    cd ollama-web-service
    ```
3.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```

## Usage

1.  **Start the Ollama server** on your machine. Ensure it's running and accessible (default: `http://localhost:11434`).
2.  **Start the Node.js web service:**
    ```bash
    node index.js
    ```
    You should see a message like: `Server running on http://localhost:3000`.
3.  **Open your web browser** and navigate to:
    ```
    http://localhost:3000
    ```

### Interacting with the UI

*   **Select Model:** Choose an available Ollama model from the dropdown list. Click "Refresh Models" if new models have been pulled.
*   **Chat Tab:**
    *   Enter your message in the "Chat Message" textarea.
    *   Click "Send" to get a conversational response.
    *   Check "Enable Thinking" to see the model's internal thought process (if supported by the model).
    *   Adjust "Temperature" (randomness) and "Max Tokens" (response length).
*   **Generate Text Tab:**
    *   Enter your prompt in the "Prompt" textarea.
    *   Click "Generate" to get a single-turn text completion.
    *   "Enable Thinking", "Temperature", and "Max Tokens" also apply here.

## API Endpoints (Backend)

The Node.js backend proxies the following Ollama API endpoints:

*   `POST /api/ollama/generate`: Proxies `POST http://localhost:11434/api/generate`
*   `POST /api/ollama/chat`: Proxies `POST http://localhost:11434/api/chat`
*   `GET /api/ollama/models`: Proxies `GET http://localhost:11434/api/tags`

## Configuration

*   **`OLLAMA_API_BASE_URL`**: Configured in `index.js`. By default, it's `http://localhost:11434`. Modify this if your Ollama instance is running on a different host or port.
*   **`PORT`**: The port for the Node.js web service (default: `3000`).
*   **`Max Tokens` (`num_predict`)**: The default value in the UI is `512`. This parameter is crucial for controlling the length of the model's output. If the model stops prematurely, especially when "Enable Thinking" is active, consider increasing this value.

## Future Improvements

*   Add more Ollama API parameters to the UI (e.g., `top_k`, `top_p`, `repeat_penalty`).
*   Implement a "Clear Chat" button.
*   Allow users to configure the `OLLAMA_API_BASE_URL` from the frontend.
*   Add system message configuration for chat.
*   Support for multimodal inputs (images).
*   More advanced styling and theming options.
