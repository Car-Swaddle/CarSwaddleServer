import React from 'react';
import { BrowserRouter, Route, Link, Redirect } from 'react-router-dom';

import { authenticationService } from './services/authenticationService';
import LoginPage from './components/LoginPage';
import AffiliateDashboard from './components/AffiliateDashboard';

export default function App() {
    const [authenticated, setAuthenticated] = React.useState(authenticationService.isAuthenticated());

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
                    <AffiliateDashboard />
                </Route>
                <Redirect from="*" to="/affiliate" />
                </>
            }
        </BrowserRouter>
    );
}
