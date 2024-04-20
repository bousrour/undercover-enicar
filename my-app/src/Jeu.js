import React from 'react';
import logo from './photo/logo.png';

import { useLocation } from 'react-router-dom';
import Chats from "./Chats"
function Jeu() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const pseudo = params.get('pseudo');
  return (
    <div className="landing-page" style={{ backgroundColor: '#000b2e', color: '#ffffff' }}>
      <div style={{ backgroundColor: '#2E1D35', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <img src={logo} alt="Example" style={{ height: 70, width: 250 }} />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
           <h1>Salut {pseudo}</h1>
           <Chats pseudo={pseudo} />
      </div>
    </div>
  );
}

export default Jeu;
