# CloudGPT - IGUANA

A simple interactive ChatGPT-style chatbot application built using MERN stack. The project integrates with OpenAI API to generate AI responses and provides a clean chat UI.

---

## 🚀 Features

- ChatGPT-like messaging interface
- Real-time AI responses
- Clean and responsive UI
- Backend API using Node.js & Express
- MongoDB for storing conversation history (optional)
- Easy deployment and customization

---

## 🧰 Tech Stack

| Layer      | Technology |
|-----------|------------|
| Frontend  | React.js   |
| Backend   | Node.js + Express.js |
| Database  | MongoDB (optional) |
| API       | OpenAI API |
| Version Control | Git & GitHub |

---

## 🔧 Installation & Setup

## 🚀 Getting Started

1.  **Clone the Repository**

    ```bash
    git clone [https://github.com/Nitya3003/ChatBot.git]
    cd CloudGPT-IGUANA
    ```

---

2.  **Set Up Environment Variables**

    Create a `.env` file inside the `server` folder and add your keys.

    ```ini
    PORT=5000
    OPENAI_API_KEY=your_openai_api_key_here
    MONGO_URL=your_mongodb_connection_string_here
    ```

---

3.  **Start the Backend**

    (From the root `CloudGPT-IGUANA` directory)

    ```bash
    cd server
    npm install
    npm start
    ```

---

4.  **Start the Frontend**

    (In a **new terminal**, from the root `ChatBot` directory)

    ```bash
    cd client
    npm install
    npm start
    ```

## 🌐 Access the App

Once both the frontend and backend are running, open your browser and go to:

```bash
http://localhost:3000
```

## 📌 Notes :-

You must add a valid OpenAI API key in your server/.env file for the chat to work.

The MONGO_URL is optional if you don't need to store conversation history.

Make sure your backend server (on port 5000) is running before you try to send a message from the app.