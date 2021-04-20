import { handleResponse } from '../_helpers/handleResponse';

export const authenticationService = {
    login,
    logout,
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

    return fetch(`/login`, requestOptions)
        .then(handleResponse)
        .then(data => {
            return data.token;
        });
}

function logout() {
    // Move to login screen with message
}