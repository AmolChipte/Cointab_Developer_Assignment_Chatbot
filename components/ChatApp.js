"use client";
import { useEffect, useState, useRef } from "react";
import { FaEdit, FaTrash, FaStop, FaPlay } from "react-icons/fa";

// Date Formating Function for Chat History
function formatChatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isYesterday) return "Yesterday";
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Main Function
export default function ChatApp() {
    const [chats, setChats] = useState([]);
    const [currentChatIndex, setCurrentChatIndex] = useState(null);
    const [userInput, setUserInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const controllerRef = useRef(null);
    const bottomRef = useRef(null);

    // Creating New Chat in Database
    const createNewChatInDB = async () => {
        const res = await fetch("/api/chats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "New Chat" })
        });
        return await res.json();
    };


    // Load All Previous Chats
    useEffect(() => {
        const loadChats = async () => {
            const res = await fetch("/api/chats");
            const data = await res.json();

            if (data.length === 0) {

                // Initial new empty chat
                const newChat = await createNewChatInDB();
                setChats([newChat]);
                setCurrentChatIndex(0);
            } else {
                setChats(data);
                setCurrentChatIndex(0);
            }
        };

        loadChats();
    }, []);

    // Scroll when Assistant is Typing or User Enters Propmt
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chats]);

    // Create New Chat on Clicking Button
    const createNewChat = async () => {
        const res = await fetch("/api/chats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "New Chat" })
        });
        const newChat = await res.json();

        newChat.messages = [];

        setChats(prev => [newChat, ...prev]);
        setCurrentChatIndex(0);
    };

    // Store and Return Saved Data
    const saveMessage = async (chatId, sender, text) => {
        if (!text?.trim()) return null;

        const res = await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatId, sender, text })
        });

        if (!res.ok) return null;
        return await res.json();
    };


    const sendMessage = async () => {
        if (!userInput.trim() || currentChatIndex === null) return;
        const chatId = chats[currentChatIndex].id;

        // If no messages yet and title is "New Chat", rename chat
        if (chats[currentChatIndex].messages.length === 0) {
            const autoTitle = userInput.slice(0, 20) + "...";
            await fetch("/api/chats", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: chatId, title: autoTitle })
            });
            setChats(prev => {
                const updated = [...prev];
                updated[currentChatIndex].title = autoTitle;
                return updated;
            });
        }


        // Save user message to DB
        const newMsg = await saveMessage(chatId, "user", userInput);

        // Auto rename chat if it still has the default name
        if (chats[currentChatIndex].title === "New Chat") {
            const autoTitle = userInput.slice(0, 20) + "...";
            await fetch("/api/chats", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: chatId, title: autoTitle })
            });
            setChats(prev => {
                const updated = [...prev];
                updated[currentChatIndex].title = autoTitle;
                return updated;
            });
        }

        // Update UI with user's message
        if (newMsg) {
            setChats(prev => {
                const updated = [...prev];
                const msgs = updated[currentChatIndex].messages;

                if (!msgs.some(m => m.id === newMsg.id)) {
                    msgs.push(newMsg);
                }

                return updated;
            });
        }

        //  clear input
        setUserInput("");

        // Insert typing indicator for Assistant
        setChats(prev => {
            const updated = [...prev];
            const msgs = updated[currentChatIndex].messages;

            if (msgs[msgs.length - 1]?.text !== "...") {
                msgs.push({ sender: "bot", text: "...", createdAt: new Date().toISOString() });
            }

            return updated;
        });

        setIsStreaming(true);

        // Abort Prompt Button
        const abortController = new AbortController();
        controllerRef.current = abortController;

        const res = await fetch("/api/ollama", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: userInput }),
            signal: abortController.signal
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let botText = "";

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                chunk.split("\n").forEach(async (line) => {
                    if (line.trim()) {
                        try {
                            const json = JSON.parse(line);
                            if (json.response) {
                                botText += json.response;

                                setChats(prev => {
                                    const updated = [...prev];
                                    const msgs = updated[currentChatIndex].messages;
                                    if (msgs[msgs.length - 1]?.sender === "bot") {
                                        msgs[msgs.length - 1].text = botText;
                                    } else {
                                        msgs.push({ sender: "bot", text: botText, createdAt: new Date().toISOString() });
                                    }
                                    return updated;
                                });
                            }
                        } catch { }
                    }
                });
            }

            // Save Assistant message in Database
            if (botText.trim()) await saveMessage(chatId, "bot", botText);

        } catch (err) {
            if (err.name !== "AbortError") console.error(err);
        } finally {
            setIsStreaming(false);
        }
    };

    const stopStreaming = () => {
        if (controllerRef.current) controllerRef.current.abort();
        setIsStreaming(false);
    };

    return (
        <div className="flex h-screen">

            {/* Sidebar */}
            <div className="w-3/12 bg-gray-900 text-white p-4 sidebar">

                {/* New Chat button */}
                <button onClick={createNewChat} className="bg-gray-900 text-white px-4 py-2 w-full mb-4 rounded newChatBtn">
                    New Chat
                </button>

                {/* Previous Chat History */}
                <h2 className=" py-2 w-full mb-4 titleHistory">ChatGPT-style App</h2>
                <div className="space-y-2">
                    {chats.map((chat, i) => (
                        <div
                            key={chat.id}
                            className={`flex items-center justify-between p-2 rounded cursor-pointer text-black ${i === currentChatIndex ? "bg-gray-300 hover:bg-gray-400" : "hover:bg-gray-400 bg-gray-200"}`}
                        >
                            <div onClick={() => setCurrentChatIndex(i)} className="flex flex-col cursor-pointer">
                                <span className="font-bold">{chat.title}</span>
                                <span className="text-xs text-gray-800">{formatChatDate(chat.createdAt)}</span>
                            </div>


                            <div className="flex space-x-1">
                                {/* Rename Button*/}
                                <button
                                    onClick={async () => {
                                        const newTitle = window.prompt("Enter new title:", chat.title);

                                        if (!newTitle?.trim()) return;
                                        await fetch("/api/chats", {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ id: chat.id, title: newTitle })
                                        });
                                        setChats(prev => {
                                            const updated = [...prev];
                                            updated[i].title = newTitle;
                                            return updated;
                                        });
                                    }}
                                    className="text-blue-400 hover:text-blue-300"
                                >
                                    <FaEdit className="inline-block mr-1" />
                                </button>

                                {/* Delete Button */}
                                <button
                                    onClick={async () => {
                                        if (!confirm("Delete this chat?")) return;
                                        await fetch("/api/chats", {
                                            method: "DELETE",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ id: chat.id })
                                        });
                                        setChats(prev => prev.filter((_, idx) => idx !== i));
                                        if (currentChatIndex === i) setCurrentChatIndex(null);
                                    }}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    <FaTrash className="inline-block mr-1" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>


            {/* Assistant + User Chat Area*/}
            <div className="flex flex-col flex-1" style={{ backgroundColor: '#FFFDF9' }}>
                {currentChatIndex !== null && (
                    <div className="p-4 text-xl font-bold text-center shadow-sm sticky top-0 z-10">
                        <h1>{chats[currentChatIndex]?.title || "Untitled Chat"}</h1>
                    </div>
                )}
                <div className="flex-1 p-4 overflow-y-auto space-y-2" style={{ paddingLeft: '5%' }}>
                    {currentChatIndex !== null &&
                        Array.isArray(chats[currentChatIndex]?.messages) &&
                        chats[currentChatIndex].messages.map((m, idx) => (
                            <div
                                key={idx}
                                className={`p-2 max-w-xl rounded-lg ${m.sender === "user"
                                    ? "text-black self-end"
                                    : "text-black self-start"
                                    }`}
                            >
                                <strong>{m.sender === "user" ? "User" : "Assistant"}:</strong>
                                <div className="mt-1">
                                    {m.sender !== "user" && m.text === "..." ? (
                                        <span className="flex space-x-1 text-gray-600 italic">
                                            <span className="animate-bounce">.</span>
                                            <span className="animate-bounce delay-100">.</span>
                                            <span className="animate-bounce delay-200">.</span>
                                        </span>
                                    ) : (
                                        <span>{m.text}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    }

                    {/* Auto Scroll Element */}
                    <div ref={bottomRef} />
                </div>

                {/* Propmt Input from User */}
                {currentChatIndex !== null && (
                    <div className="p-3 bg-white flex space-x-2 border-t formEle">
                        <input
                            value={userInput}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            placeholder="Type a message..."
                            onChange={(e) => setUserInput(e.target.value)}
                            disabled={isStreaming}
                            className="border px-3 py-2 rounded w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        />

                        {/* Button Switching */}
                        {!isStreaming && <button onClick={sendMessage} className="bg-blue-600 text-white px-4 rounded sendBtn"><FaPlay className="inline-block mr-1" /></button>}
                        {isStreaming && <button onClick={stopStreaming} className="bg-red-600 text-white px-4 rounded stopBtn"><FaStop className="inline-block mr-1" /></button>}
                    </div>
                )}
            </div>
        </div>
    );
}
