import { handleResponse } from './handleResponse';

export const AuthenticationService = {
    login,
    logout,
    isAuthenticated,
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
            window.localStorage.setItem('user', JSON.stringify(data.user));
             // TODO - update state so we move to new page
            return data.token;
        });
}

function logout() {
    // Delete cookie
    document.cookie = "cw-jwt" +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    // Move to login page
    // history.replaceState({}, "Login", "/login");
}

function isAuthenticated(): boolean {
    return (document.cookie.match(/^(.*;)?\s*cs-jwt\s*=\s*[^;]+(.*)?$/)?.length ?? 0) > 0;
}
