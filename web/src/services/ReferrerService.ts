import { handleResponse } from './handleResponse'

export const ReferrerService = {
    getCurrentUserReferrer,
    getSummary,
    getTransactions,
    getPayStructure,
};

function getCurrentUserReferrer() {
    return fetch(`/referrers/current-user`)
        .then(handleResponse)
        .then(data => {
            return data;
        });
}

function getSummary(referrerID: string) {
    return fetch(`/referrers/${referrerID}/summary`)
        .then(handleResponse)
        .then(data => {
            return data;
        });
}

function getTransactions(referrerID: string) {
    return fetch(`/referrers/${referrerID}/transactions`)
        .then(handleResponse)
        .then(data => {
            return data;
        });
}

function getPayStructure(payStructureID: string) {
    return fetch(`/pay-structures/${payStructureID}`)
        .then(handleResponse)
        .then(data => {
            return data;
        });
}
