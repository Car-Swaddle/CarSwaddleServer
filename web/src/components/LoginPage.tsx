import React from 'react';

import { AuthenticationService } from '../services/authenticationService';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import ErrorLabel from './ErrorLabel';
import CarSwaddleAffiliateLogo from './CarSwaddleAffiliateLogo';

export type LoginPageProps = {
    finishedAuth: () => void,
}


export default function LoginPage({ finishedAuth }: LoginPageProps) {
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [hasError, setHasError] = React.useState(false);

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
                    setHasError(true)
                }
            }).catch(err => {
                setHasError(true)
            });
    }

    const styles = {
        error: {
            margin: '16px'
        }
    }

    const errorMessage = 'Car Swaddle was unable to log you in. You will need to create an account using the iOS or Android customer app.\n\nIf you\'ve already done that, please make sure your email and password are correct and try again'

    return (
        <Container>
            <CarSwaddleAffiliateLogo/>
            <Row>
                <Col sm={{ span: 6, offset: 3 }} lg={{ span: 4, offset: 4 }}>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group controlId="formBasicEmail">
                            <Form.Control autoFocus type="email" value={email}
                                onChange={ (e) => {
                                    setEmail(e.target.value)
                                    setHasError(false)
                                }}
                                placeholder="Email" />
                        </Form.Group>

                        <Form.Group controlId="formBasicPassword">
                            <Form.Control type="password" value={password} 
                            onChange={(e) =>  {
                                setPassword(e.target.value)
                                setHasError(false)
                            }}
                            placeholder="Password" />
                        </Form.Group>
                        {hasError ? <ErrorLabel text={errorMessage} /> : null}

                        <Button variant="primary" type="submit" disabled={!validateForm()} block>
                            Login
                        </Button>
                    </Form>
                </Col>
            </Row>
        </Container>
    )
}