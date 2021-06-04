import React from 'react';
import { BrowserRouter, Route, Redirect } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';

import { AuthenticationService } from './services/authenticationService';
import LoginPage from './components/LoginPage';
import AffiliateDashboard from './components/AffiliateDashboard';
import StripeLanding from './components/StripeLanding';
import { UserContext } from './services/user-context';
import { Referrer } from "./models"

export default function App() {
    const [authenticated, setAuthenticated] = React.useState(AuthenticationService.isAuthenticated());
    const [referrer, setReferrer] = React.useState<Referrer | null>()

    function finishedAuth() {
        setAuthenticated(true);
    }

    React.useEffect(() => {
        setReferrer(UserContext.getCurrentReferrer());
    }, [authenticated])

    return (
    <Container>
        <Row>
            <Col>
                <div className="mt-4 mb-3 text-center"><img src={`/img/cs-logo.png`} style={{maxWidth: "300px"}}/></div>
            </Col>
        </Row>
        <Row>
            <Col className="mb-3 text-center"><h1><b>Affiliate</b></h1></Col>
        </Row>
        <Row>
        <BrowserRouter>
            {!authenticated
                ? <>
                <Route path="/login">
                    <LoginPage finishedAuth={finishedAuth}/>
                </Route>
                <Redirect to="/login" />
                </>
                : ((!referrer || !referrer.stripeExpressAccountID) ?
                    <>
                    <Route path="/affiliate/stripe">
                        <StripeLanding finishedAuth={finishedAuth} />
                    </Route>
                    <Redirect from="*" to={`/affiliate/stripe${window.location.search}`} />
                    </>
                    :
                    <>
                    <Route path="/affiliate">
                        <AffiliateDashboard /> 
                    </Route>
                    <Redirect from="*" to="/affiliate" />
                    </>
                )
            }
        </BrowserRouter>
        </Row>
    </Container>
    );
}
