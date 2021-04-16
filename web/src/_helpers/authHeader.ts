import { authenticationService } from '../_services/authenticationService';

export function authHeader() {
    // return authorization header with jwt token
    const currentToken = authenticationService.currentToken;
    if (currentToken) {
        return { Authorization: `Bearer ${currentToken}` };
    } else {
        return {};
    }
}