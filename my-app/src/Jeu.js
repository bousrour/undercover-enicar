import React from 'react';
import logo from './photo/logo.png';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';

function Jeu() {
  return (
    <div className="landing-page" style={{ backgroundColor: '#000b2e', color: '#ffffff' }}>
      <div style={{ backgroundColor: '#2E1D35', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <img src={logo} alt="Example" style={{ height: 70, width: 250 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <Card style={{ height: 150, width: 700, margin: 50 }}>
          <Form.Label>Rejoindre un jeu</Form.Label>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <Form.Control
              type="email"
              placeholder="Code du jeu"
              autoFocus
              style={{ border: '1px solid grey', borderRadius: '4px' }}
            />
            <Button variant="success">Rejoindre</Button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'auto',marginBottom:10 }}>
            <Button variant="primary" style={{ width: 'auto' }}>Crée un jeu</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Jeu;
