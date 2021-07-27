import { AuthenticationService } from './authenticationService';

export function handleResponse(response: any) {
    return response
    .json()
    .then((data: any) => {
        if (!response.ok) {
            if (401 === response.status) {
                // auto logout if 401 Unauthorized response returned from api
                AuthenticationService.logout();
            }

            const error = (data && data.message) || response.statusText;
            return Promise.reject(error);
        }

        return data;
    });
}