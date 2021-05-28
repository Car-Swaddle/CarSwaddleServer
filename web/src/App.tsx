import React from 'react';
import { BrowserRouter, Route, Link, Redirect } from 'react-router-dom';

import { AuthenticationService } from './services/authenticationService';
import LoginPage from './components/LoginPage';
import AffiliateDashboard from './components/AffiliateDashboard';
import StripeLanding from './components/StripeLanding';

export default function App() {
    const [authenticated, setAuthenticated] = React.useState(AuthenticationService.isAuthenticated());

    function finishedAuth() {
        setAuthenticated(true);
    }

    return (
        <BrowserRouter>
            {!authenticated
                ? <>
                <Route path="/login">
                    <LoginPage finishedAuth={finishedAuth}/>
                </Route>
                <Redirect to="/login" />
                </>
                : <>
                <Route path="/affiliate">
                    <StripeLanding />
                    {/* <AffiliateDashboard /> */}
                </Route>
                <Redirect from="*" to="/affiliate" />
                </>
            }
        </BrowserRouter>
    );
}
