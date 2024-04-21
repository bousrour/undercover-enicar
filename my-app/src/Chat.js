import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import Button from 'react-bootstrap/Button';

function Chat({ socket, username, room }) {
  const [userList, setUserList] = useState([]); 
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [isChatReady, setIsChatReady] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [assignedWord, setAssignedWord] = useState("");
  const [currentTurn, setCurrentTurn] = useState("");
  const [isMyTurn, setIsMyTurn] = useState(false);
  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        room: room,
        author: username,
        message: currentMessage,
        time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes(),
      };
      await socket.emit("send_message", messageData);
      setCurrentMessage("");
    }
  };

  useEffect(() => {
    // Listening for incoming messages
    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    // Room is now ready to start chatting
    socket.on("start_chat", () => {
      setIsChatReady(true);
    });
    socket.on("turn_update", (data) => {
      setCurrentTurn(data.username);
      setIsMyTurn(data.username === username);
   console.log(isMyTurn);
    });

    // Managing the list of users in the room
    socket.on("room_users", (users) => {
      if (Array.isArray(users)) {  // Check if users is indeed an array
        setUserList(users);
      } else {
        console.error('Expected users to be an array, received:', users);
      }
    });
    socket.on("assigned_word", (word) => {
      setAssignedWord(word); // Listen to the assigned word event
  });
    return () => {
      socket.off("receive_message");
      socket.off("start_chat");
      socket.off("room_users");
      socket.off("assigned_word");
      socket.off("turn_update");
    };
  }, [socket,userList,isMyTurn]);

console.log(isMyTurn)
  const handleReady = () => {
    setIsReady(true);
    socket.emit("user_ready", { room, username });
  };

  return (<>
<div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', padding: '50px' }}>
<div className="user-list" style={{ marginRight: '200px' ,display: 'flex', flexDirection: 'column'}}>
                <h1>joueurs</h1>
                {userList.map((user, index) => (
                    <Button 
                        key={index} 
                        variant={user.ready ? 'success' : 'danger'}
                        
                        style={{ margin: '5px' }} // Add some margin between buttons
                    >
                        {user.username}
                    </Button>
                ))}
            </div>
      <div className="chat-window">
      {!isChatReady && (
        <Button onClick={handleReady} disabled={isReady} variant="success">
          {isReady ? "Waiting for other players..." : "pres a jouer!"}
        </Button>
      )}
      {isChatReady && (
        <>
 <div className="chat-header">
              <p>{currentTurn ? `tour de ${currentTurn}` : "Waiting..."}</p>
            </div>          <div className="chat-body">
            <ScrollToBottom className="message-container">
              {messageList.map((messageContent, index) => (
                <div
                  key={index}
                  className="message"
                  id={username === messageContent.author ? "you" : "other"}
                >
                  <div className="message-content">
                    <p>{messageContent.message}</p>
                  </div>
                  <div className="message-meta">
                    <p id="time">{messageContent.time}</p>
                    <p id="author">{messageContent.author}</p>
                  </div>
                </div>
              ))}
            </ScrollToBottom>
          </div>
          <div className="chat-footer">
                <input
                  type="text"
                  value={currentMessage}
                  placeholder={isMyTurn ? "Écrivez un message..." : "Attendre votre tour"}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && isMyTurn && sendMessage()}
                  disabled={!isMyTurn}
                />
                <button onClick={sendMessage} disabled={!isMyTurn}>&#9658;</button>
              </div>
        </>
      )}
    </div>
   <div style={{ marginLeft: '200px' }}> 
    <h1>Votre mot</h1>
    <Button variant="light">{assignedWord}</Button>
     </div>
   </div>
   <div className="user-list" style={{ marginRight: '200px' ,display: 'flex', flexDirection: 'row' ,justifyContent: 'center'}}>
                <h1>voter</h1>
                {userList.map((user, index) => (
                    <Button 
                        key={index} 
                        variant={user.ready ? 'success' : 'danger'}
                        
                        style={{ margin: '5px' }} // Add some margin between buttons
                    >
                        {user.username}
                    </Button>
                ))}
            </div>
   </>
  );
}

export default Chat;