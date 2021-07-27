import React from 'react';
import { BrowserRouter, Route, Redirect } from 'react-router-dom';

import { AuthenticationService } from './services/authenticationService';
import LoginPage from './components/LoginPage';
import StripeLanding from './components/StripeLanding';
import { UserContext } from './services/user-context';
import { Referrer } from "./models"
import AuthenticatedPage from './components/AuthenticatedPage';

export default function App() {
    const [authenticated, setAuthenticated] = React.useState(AuthenticationService.isAuthenticated());
    const [referrer, setReferrer] = React.useState<Referrer | null>(UserContext.getCurrentReferrer());

    function finishedAuth() {
        setAuthenticated(true);
        setReferrer(UserContext.getCurrentReferrer());
    }

    return (
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
    );
}
