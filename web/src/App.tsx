import React from 'react';
import { BrowserRouter, Route, Link } from 'react-router-dom';

import { authenticationService } from './_services/authenticationService';
import ProtectedRoute from './_components/ProtectedRoute';
import { LoginPage } from './LoginPage/LoginPage';

class App extends React.Component<{}, {currentToken: string | null}> {
    constructor(props: any) {
        super(props);

        this.state = {
            currentToken: null,
        };
    }

    componentDidMount() {
      authenticationService.currentToken.subscribe(x => this.setState({ currentToken: x }));
    }

    logout() {
        authenticationService.logout();
        // history.push('/login');
    }

    render() {
        const { currentToken } = this.state;
        return (
            <BrowserRouter>
                <div>
                    {currentToken &&
                        <nav className="navbar navbar-expand navbar-dark bg-dark">
                            <div className="navbar-nav">
                                <Link to="/" className="nav-item nav-link">Home</Link>
                                <a onClick={this.logout} className="nav-item nav-link">Logout</a>
                            </div>
                        </nav>
                    }
                    <div className="jumbotron">
                        <div className="container">
                            <div className="row">
                                <div className="col-md-6 offset-md-3">
                                    <ProtectedRoute isAuthenticated={(currentToken && currentToken.length>0)===true} authenticationPath="/" />
                                    <Route path="/login" component={LoginPage} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </BrowserRouter>
        );
    }
}

export { App }; 
