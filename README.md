# Cointab Developer Assignment – Chatbot App

This project is a full-stack **ChatGPT-style chatbot** built for the Cointab developer assignment. It uses **Next.js** (App Router) for the frontend, **Node.js** for the backend, and **PostgreSQL** for storing chats. The assistant responses are powered by **Ollama** using the `gemma3:1b` model locally.

## Implementations

- Chat interface with streaming AI assistant responses
- LLM integration via Ollama (`gemma3:1b`)
- Stores chats and messages in PostgreSQL
- Sidebar with chat history
- Edit/Delete chat titles
- Typing indicator for assistant
- .env support for environment variables

---

## Tech Stack

| Layer       | Tech                                      |
|-------------|-------------------------------------------|
| Frontend    | Next.js (App Router), TailwindCSS         |
| Backend     | Node.js, Next.js API Routes               |
| Database    | PostgreSQL (via Prisma ORM)               |
| LLM         | Ollama (`gemma3:1b`)                       |

---

## Local Machine Installation

### 1. Clone the Repository

```bash
git clone https://github.com/AmolChipte/Cointab_Developer_Assignment_Chatbot.git
cd Cointab_Developer_Assignment_Chatbot

### 2. Install Dependencies
npm install

### 3. Set Up Environment Variables
Create a .env file in the root:
DATABASE_URL=postgresql://user_name:user_password@localhost:5432/database_name
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000

### 4. Set Up PostgreSQL
npx prisma generate
npx prisma migrate dev --name init

### 5. Start Ollama (for LLM)
ollama run gemma3:1b

### 6. Run the App
npm run dev

---

## API Routes

/api/chat – Create a New Chat, Delete Chat, Edit Chat Title, Load All Previous Chats
/api/message – Save user message
/api/send – Send message and stream assistant reply
/api/ollama – Interface with Ollama LLM locally
