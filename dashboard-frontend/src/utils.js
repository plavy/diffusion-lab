import { Buffer } from "buffer";

export function getBackendURL() {
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
}

export function getNextcloudSettings(name) {
    try {
        return JSON.parse(localStorage.getItem('nextcloud-settings'))[name];
    } catch (e){
        return "";
    }
}

export function getAuthHeader() {
    const authHeader = Buffer.from(`${getNextcloudSettings("nextcloud-domain")}:${getNextcloudSettings("nextcloud-username")}:${getNextcloudSettings("nextcloud-password")}`).toString('base64');
    return "Basic " + authHeader;
}