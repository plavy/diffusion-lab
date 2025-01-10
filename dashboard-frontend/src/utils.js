import { Buffer } from "buffer";

export function getDateTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}

export function getBackendURL() {
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
}

export function storeAuth(authDict) {
    storeLocal('webdav-creds', authDict);
}

export function getAuth() {
    return getLocal('webdav-creds');
}

export function isAuth() {
    const auth = getAuth();
    try {
        if (auth.url && auth.username && auth.password) {
            return true;
        } else {
            return false;
        }
    } catch {
        return false;
    }
}

export function getAuthHeader() {
    console.log('get auth header')
    if (isAuth()) {
        const authHeader = Buffer.from(`${getAuth().url}:${getAuth().username}:${getAuth().password}`).toString('base64');
        return 'Basic ' + authHeader;
    } else {
        return '';
    }
}

export function storeLocal(key, object) {
    localStorage.setItem(key, JSON.stringify(object));
}

export function getLocal(key) {
    return JSON.parse(localStorage.getItem(key));
}

export function logout() {
    storeAuth({
        url: getAuth().url
    });
}