import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import backImage from './photo/back.png';
import logo from './photo/logo.png';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

function LandingPage() {
  const [modalShow, setModalShow] = useState(false);
  const [pseudo, setPseudo] = useState('');
  const navigate = useNavigate();

  const handleContinue = () => {
    // Navigate to '/jeu' with pseudo as a URL parameter
    navigate(`/jeu?pseudo=${pseudo}`);
  };

  const handlePseudoChange = (event) => {
    setPseudo(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Do something with the pseudo, like storing it in state or submitting it to a server
    console.log('Pseudo:', pseudo);
    handleContinue();
  };

  return (
    <div className="landing-page" style={{ backgroundColor: '#000b2e', color: '#ffffff' }}>
      <div style={{ backgroundColor: '#2E1D35', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <img src={logo} alt="Example" style={{ height: 70, width: 250 }} />
      </div>
      <img src={backImage} alt="Example" />

      <div style={{ margin: 25, display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <h1>Bienvenu a Undercover</h1>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <Button variant="dark" onClick={() => setModalShow(true)}>Jouer</Button>
        <Button variant="danger">Régles</Button>
        <Modal
          show={modalShow}
          onHide={() => setModalShow(false)}
          size="lg"
          aria-labelledby="contained-modal-title-vcenter"
          centered
          style={{ maxWidth: '400px', margin: 'auto', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
              Entrer un pseudo pour continuer  ...
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                <Form.Control
                  type="text"
                  placeholder="pseudo"
                  autoFocus
                  value={pseudo}
                  onChange={handlePseudoChange}
                />
              </Form.Group>
              <Modal.Footer>
                <Button type="submit">Continuer</Button>
              </Modal.Footer>
            </Form>
          </Modal.Body>
        </Modal>
      </div>
    </div>
  );
}

export default LandingPage;
