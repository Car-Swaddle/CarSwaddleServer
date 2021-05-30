import { User, Referrer } from "../models"

export const UserContext = {
    getCurrentUser,
    getCurrentReferrer,
    setCurrentUser,
    setCurrentReferrer
};

const storage = window.localStorage;

function getCurrentUser(): (User | undefined) {
    return JSON.parse(storage.getItem("user") ?? "{}");
}

function getCurrentReferrer(): (Referrer | undefined) {
    return JSON.parse(storage.getItem("referrer") ?? "{}");
}

function setCurrentUser(user: User) {
    return storage.setItem("user", JSON.stringify(user));
}

function setCurrentReferrer(referrer: Referrer) {
    return storage.setItem("referrer", JSON.stringify(referrer));
}
