import "./App.css";
import io from "socket.io-client";
import { useState , useEffect } from "react";
import Chat from "./Chat"
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
const socket = io.connect("http://localhost:3001");

function Chats({ pseudo }) { 
   const [username, setUsername] = useState('');
  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);

  const joinRoom = () => {
    if (username !== "" && room !== "") {
      socket.emit("join_room", room);
      setShowChat(true);
    }
  };
  useEffect(() => {
    setUsername(pseudo);
  }, [pseudo]);
  return (
    <div className="App">
      {!showChat ? (
        <div className="joinChatContainer">
           <Card style={{ height: 200, width: 700, margin: 50 }}>
          <h1>Rejoindre un jeu</h1>
          <p>(si le jeu n'existe pas elle sera crée)</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <Form.Control
              type="email"
              placeholder="Code du jeu"
              autoFocus
              style={{ border: '1px solid grey', borderRadius: '4px' }}
              onChange={(event) => {
                setRoom(event.target.value);
              }}
            />
            <Button onClick={joinRoom} variant="success">Rejoindre</Button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'auto',marginBottom:10 }}>
          </div>
        </Card>
        
        </div>
      ) : (
        <Chat socket={socket} username={username} room={room} />
      )}
    </div>
  );
}

export default Chats;