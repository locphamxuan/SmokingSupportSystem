import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "../style/CoachChatPage.scss";

const CoachChatPage = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [memberData, setMemberData] = useState(null);
  const [socket, setSocket] = useState(null);

  // Memoize user and token to prevent recreation on every render
  const { user, token } = useMemo(() => {
    let user = null;
    try {
      const userStr = localStorage.getItem("user");
      if (userStr && userStr !== "undefined") {
        user = JSON.parse(userStr);
      }
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
    }
    const token = localStorage.getItem("token");
    return { user, token };
  }, []);

  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);

  // Hàm cuộn xuống cuối
  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (!token || !user) {
      navigate("/login");
      return;
    }
    setMemberData({ Username: `Thành viên #${memberId}` });
  }, [memberId, navigate, token, user]);

  useEffect(() => {
    if (!token) return;

    const newSocket = io("http://localhost:5000", {
      query: { token },
      transports: ["websocket"],
    });
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (!socket || !user) return;

    socket.on("messageHistory", (history) => {
      setMessages(history);
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    });

    socket.on("newMessage", (message) => {
      setMessages((prev) => [...prev, message]);
      setTimeout(scrollToBottom, 100);
    });

    socket.on("error", (msg) => setError(msg));
    socket.emit("joinChat", { userId: user.id, coachId: parseInt(memberId) });

    return () => {
      socket.off("messageHistory");
      socket.off("newMessage");
      socket.off("error");
    };
  }, [socket, user, memberId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !user) return;
    socket.emit("sendMessage", {
      senderId: user.id,
      receiverId: parseInt(memberId),
      content: newMessage.trim(),
    });
    setNewMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleBack = () => {
    navigate("/coach/dashboard");
  };

  if (loading) {
    return (
      <div className="container py-4 mt-5">
        <div className="d-flex justify-content-center align-items-center min-vh-50">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !memberData) {
    return (
      <div className="container py-4 mt-5">
        <div className="alert alert-danger text-center">{error}</div>
        <div className="text-center">
          <button className="btn btn-outline-primary mt-3" onClick={handleBack}>
            &larr; Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 px-2 mt-5">
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header mb-3 d-flex align-items-center">
          <button className="btn btn-link p-0 me-2" onClick={handleBack}>
            <span className="bi bi-arrow-left" style={{ fontSize: 22 }}>
              &larr;
            </span>
          </button>
          <div
            className="avatar bg-success text-white me-2 d-flex align-items-center justify-content-center"
            style={{ width: 35, height: 35, borderRadius: "50%" }}
          >
            {memberData?.Username?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div className="fw-bold text-primary">
              {memberData?.Username || `Thành viên #${memberId}`}
            </div>
            <div className="text-muted small">Thành viên Premium</div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="message-list" ref={messageListRef}>
          {messages.length === 0 ? (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="text-center text-muted">
                <div className="fw-bold mb-1">Chưa có tin nhắn nào</div>
                <div className="small">
                  Hãy bắt đầu cuộc trò chuyện với thành viên này!
                </div>
              </div>
            </div>
          ) : (
            <div>
              {messages.map((msg) => (
                <div
                  key={msg.Id}
                  className={`message-bubble ${msg.SenderId === parseInt(memberId) ? "left" : "right"}`}
                >
                  <div>{msg.Content}</div>
                  <div className="d-flex justify-content-between align-items-center mt-1">
                    <span className="small fw-semibold opacity-75">
                      {msg.SenderId === parseInt(memberId)
                        ? msg.SenderName
                        : "Bạn"}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <form
          className="input-area mt-auto"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <input
            type="text"
            className="form-control me-2"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Nhập tin nhắn của bạn..."
            onKeyPress={handleKeyPress}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!newMessage.trim()}
          >
            Gửi
          </button>
        </form>
      </div>
    </div>
  );
};

export default CoachChatPage;
