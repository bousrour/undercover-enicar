import React from 'react';
import backImage from './photo/back.png';
import logo from './photo/logo.png';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
function Name(props) {
    return (
      <Modal
        {...props}
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
        <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Control
                type="email"
                placeholder="pseudo"
                autoFocus
              />
            </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={props.onHide}>Continuer</Button>
        </Modal.Footer>
      </Modal>
    );
  }
function LandingPage() {
    const [modalShow, setModalShow] = React.useState(false);
  return (
    <div className="landing-page" style={{ backgroundColor: '#000b2e', color: '#ffffff' }}>
     <div style={{backgroundColor:'#2E1D35', width:'100%', display: 'flex', justifyContent: 'center' }}>
      <img src={logo} alt="Example" style={{height:70 ,width:250}}/>
      </div>
      <img src={backImage} alt="Example" />
     
      <div style={{margin: 25, display: 'flex', justifyContent: 'center', gap: '10px' }}>
      <h1>Bienvenu a Undercover</h1>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <Button variant="dark" onClick={() => setModalShow(true)}>Jouer</Button>
        <Button variant="danger">Régles</Button>
        <Name
        show={modalShow}
        onHide={() => setModalShow(false)}
       />
   
    </div>

    </div>
  );
}

export default LandingPage;
