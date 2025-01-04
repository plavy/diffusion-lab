import { Buffer } from "buffer";
import axios from "axios";

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

export function storeLocal(key, object) {
    localStorage.setItem(key, JSON.stringify(object));
}

export function getLocal(key) {
    return JSON.parse(localStorage.getItem(key));
}