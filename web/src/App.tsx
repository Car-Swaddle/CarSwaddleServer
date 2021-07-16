import React from 'react';
import { BrowserRouter, Route, Redirect } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';

import { AuthenticationService } from './services/authenticationService';
import LoginPage from './components/LoginPage';
import AffiliateDashboard from './components/AffiliateDashboard';
import StripeLanding from './components/StripeLanding';
import { UserContext } from './services/user-context';
import { Referrer } from "./models"
import AuthenticatedNavigation from './components/AuthenticatedNavigation';
import CarSwaddleAffiliateView from './components/CarSwaddleAffiliateLogo'
import AuthenticatedPage from './components/AuthenticatedPage';

export default function App() {
    const [authenticated, setAuthenticated] = React.useState(AuthenticationService.isAuthenticated());
    const [referrer, setReferrer] = React.useState<Referrer | null>(UserContext.getCurrentReferrer());

    function finishedAuth() {
        setAuthenticated(true);
        setReferrer(UserContext.getCurrentReferrer());
    }

    return (
        <Container>
            <Row>
                <BrowserRouter>
                    {!authenticated
                        ? <>
                            <Route path="/login">
                                <LoginPage finishedAuth={finishedAuth} />
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
                            <AuthenticatedPage />
                        )
                    }
                </BrowserRouter>
            </Row>
        </Container>
    );
}
