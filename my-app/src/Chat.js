import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import Button from 'react-bootstrap/Button';

function Chat({ socket, username, room }) {
  const [userList, setUserList] = useState([]); 
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [isChatReady, setIsChatReady] = useState(false); // To control chat display
  const [isReady, setIsReady] = useState(false); // To track if current user is ready

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        room: room,
        author: username,
        message: currentMessage,
        time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes(),
      };
  
      // Only emit the message to the server
      await socket.emit("send_message", messageData);
      setCurrentMessage(""); // Clear input field after sending
    }
  };
  useEffect(() => {
    
    const receiveMessage = (data) => {
      setMessageList((list) => [...list, data]);
    };

    socket.on("receive_message", receiveMessage);
    socket.on("start_chat", () => {
      setIsChatReady(true);
      const handleRoomUsers = (users) => {
            setUserList(users);
        };

        socket.on("room_users", handleRoomUsers);
    });

    return () => {
      socket.off("receive_message", receiveMessage);
      socket.off("start_chat");
    };
  }, [socket]);

  const handleReady = () => {
    setIsReady(true);
    socket.emit("user_ready", { room, username });
  };

  return (
    <div className="chat-window">
      {!isChatReady && (
      <Button onClick={handleReady} disabled={isReady} variant="success"> {isReady ? "en attente d'autres joueurs..." : "Pret a jouer!"}</Button>
      )}
      {isChatReady && (
        <>
          <div className="chat-header"><p>Live Chat</p>  <p>Users in Room: {userList.join(', ')}</p> </div>
          <div className="chat-body">
            <ScrollToBottom className="message-container">
            {messageList.map((messageContent) => {
            return (
              <div
                className="message"
                id={username === messageContent.author ? "you" : "other"}
              >
                <div>
                  <div className="message-content">
                    <p>{messageContent.message}</p>
                  </div>
                  <div className="message-meta">
                    <p id="time">{messageContent.time}</p>
                    <p id="author">{messageContent.author}</p>
                  </div>
                </div>
              </div>
            );
          })}
            </ScrollToBottom>
          </div>
          <div className="chat-footer">
            <input type="text" value={currentMessage} placeholder="Hey..." onChange={(e) => setCurrentMessage(e.target.value)} onKeyPress={(e) => e.key === "Enter" && sendMessage()} />
            <button onClick={sendMessage}>&#9658;</button>
          </div>
        </>
      )}
    </div>
  );
}

export default Chat;
