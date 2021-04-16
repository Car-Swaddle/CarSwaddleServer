import { BehaviorSubject } from 'rxjs';
import { handleResponse } from '../_helpers/handleResponse';

const CURRENT_TOKEN_KEY = 'currentToken';
var currentTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject(localStorage.getItem(CURRENT_TOKEN_KEY));

export const authenticationService = {
    login,
    logout,
    currentToken: currentTokenSubject.asObservable(),
    get currentTokenValue () { return currentTokenSubject.value },
};

function login(email: string, password: string) {
    const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: new URLSearchParams({
            'email': email,
            'password': password
        }),
    };

    return fetch(`/api/login`, requestOptions)
        .then(handleResponse)
        .then(data => {
            // store user details and jwt token in local storage to keep user logged in between page refreshes
            localStorage.setItem(CURRENT_TOKEN_KEY, data.token);
            currentTokenSubject.next(data.token);

            return data.token;
        });
}

function logout() {
    // remove user from local storage to log user out
    localStorage.removeItem('currentUser');
    currentTokenSubject.next(null);
}