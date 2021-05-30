import React from 'react';

import { AuthenticationService } from '../services/authenticationService';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';

export type LoginPageProps = {
    finishedAuth: () => void,
}

export default function LoginPage({finishedAuth}: LoginPageProps) {
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");

    function validateForm() {
        return email.length > 0 && password.length > 0;
    }

    function handleSubmit(event: any) {
        event.preventDefault();
        AuthenticationService.login(email, password)
        .then(token => {
            if (token && token.length) {
                finishedAuth()
            } else {
                // TODO - error handling
            }
        })
    }

    return (
        <Container>
            <br/>
            <Row>
                <Col sm={{span: 6, offset: 3}} lg={{span: 4, offset: 4}}>
                    <h3 className="text-center">Car Swaddle Affiliate</h3>
                </Col>
            </Row>
            <br/>
            <Row>
                <Col sm={{span: 6, offset: 3}} lg={{span: 4, offset: 4}}>
                <Form onSubmit={handleSubmit}>
                    <Form.Group controlId="formBasicEmail">
                        <Form.Control autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                    </Form.Group>

                    <Form.Group controlId="formBasicPassword">
                        <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
                    </Form.Group>
                    <Button variant="primary" type="submit" disabled={!validateForm()} block>
                        Login
                    </Button>
                </Form>
                </Col>
            </Row>
        </Container>
    )
}