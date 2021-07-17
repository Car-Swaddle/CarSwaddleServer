import { handleResponse } from './handleResponse'
import { Transaction } from '../models/index'

export const ReferrerService = {
    getCurrentUserReferrer,
    getSummary,
    getTransactions,
    getPayStructure,
    finishStripeOauthFlow,
    generateExpressLoginLink
};

async function getCurrentUserReferrer() {
    return fetch(`/referrers/current-user`)
        .then(handleResponse)
        .then(data => {
            return data;
        });
}

async function getSummary(referrerID: string) {
    return fetch(`/referrers/${referrerID}/summary`)
        .then(handleResponse)
        .then(data => {
            return data;
        });
}

async function getTransactions(referrerID: string) {
    return fetch(`api/referrers/${referrerID}/transactions`)
        .then(handleResponse)
        .then((transactions: Transaction[]) => {
            return transactions
        });
}

async function getPayStructure(payStructureID: string) {
    return fetch(`/pay-structures/${payStructureID}`)
        .then(handleResponse)
        .then(data => {
            return data;
        });
}

async function finishStripeOauthFlow(code: string) {
    return fetch(`/api/stripe/oauth-confirm?isReferrer=true&code=${code}`)
        .then(handleResponse)
        .then(data => {
            return data;
        });
}

async function generateExpressLoginLink(referrerID: string): Promise<any> {
    return fetch(`/api/stripe/express-login-link?redirect=/affiliate/dashboard&referrerID=${referrerID}`)
        .then(handleResponse)
        .then(data => {
            return data;
        });
}
