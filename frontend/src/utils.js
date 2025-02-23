import axios from "axios";
import { Buffer } from "buffer";

export const shapeList = [
  {
    id: "64x64",
    name: "64x64"
  },
  {
    id: "128x128",
    name: "128x128"
  },
  {
    id: "256x256",
    name: "256x256"
  }
]

export const valProportionList = [
  {
    id: "0.2",
    name: "0.2"
  },
  {
    id: "0.3",
    name: "0.3"
  },
  {
    id: "0.4",
    name: "0.4"
  }
]

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

export function findName(list, id) {
  return list.find(el => el.id == id)?.name
}

export function getBackendURL() {
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000/api';
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
  localStorage.removeItem('datasets');
  localStorage.removeItem('servers');
  localStorage.removeItem('last-training');
  storeAuth({
    url: getAuth().url
  });
}

export function updateDatasetList(dispatch) {
  const datasets = getLocal('datasets');
  if (datasets) {
    dispatch({ type: 'set', datasetList: datasets });
  }
  axios.get(`${getBackendURL()}/datasets`, {
    headers: {
      Authorization: getAuthHeader() // Encrypted by TLS
    }
  })
    .then((res) => { dispatch({ type: 'set', datasetList: res.data }); storeLocal('datasets', res.data) });
}

export function updateServerList(dispatch) {
  const servers = getLocal('servers');
  if (servers) {
    dispatch({ type: 'set', serverList: servers });
  }
  axios.get(`${getBackendURL()}/servers`, {
    headers: {
      Authorization: getAuthHeader() // Encrypted by TLS
    }
  })
    .then((res) => { dispatch({ type: 'set', serverList: res.data }); storeLocal('servers', res.data) });
}

export function updateDownsizingList(dispatch) {
  const downsizings = getLocal('downsizings');
  if (downsizings) {
    dispatch({ type: 'set', downsizingList: downsizings });
  }
  axios.get(`${getBackendURL()}/downsizings`, {
    headers: {
      Authorization: getAuthHeader() // Encrypted by TLS
    }
  })
    .then((res) => { dispatch({ type: 'set', downsizingList: res.data }); storeLocal('downsizings', res.data) });
}

export function updateAugmentationList(dispatch) {
  const augmentations = getLocal('augmentations');
  if (augmentations) {
    dispatch({ type: 'set', augmentationList: augmentations });
  }
  axios.get(`${getBackendURL()}/augmentations`, {
    headers: {
      Authorization: getAuthHeader() // Encrypted by TLS
    }
  })
    .then((res) => { dispatch({ type: 'set', augmentationList: res.data }); storeLocal('augmentations', res.data) });
}

export function updateModelList(dispatch) {
  const models = getLocal('models');
  if (models) {
    dispatch({ type: 'set', modelList: models });
  }
  axios.get(`${getBackendURL()}/models`, {
    headers: {
      Authorization: getAuthHeader() // Encrypted by TLS
    }
  })
    .then((res) => { dispatch({ type: 'set', modelList: res.data }); storeLocal('models', res.data) });
}
