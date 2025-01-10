import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import classNames from 'classnames';
import axios from "axios";
import { getAuthHeader, getBackendURL } from "../../utils";
import { CAlert, CButton, CContainer, CForm, CFormInput, CSpinner } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilCheck, cilWarning } from "@coreui/icons";

const ServerDashboard = () => {

  const { id } = useParams();

  const [siteReady, setSiteReady] = useState(false);
  useEffect(() => {
    setSiteReady(false)
  }, [id]);

  const [metadata, setMetadata] = useState("");
  useEffect(() => {
    axios.get(`${getBackendURL()}/servers/` + id, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    }).then((res) => { setMetadata(res.data); setSiteReady(true) });
  }, [id]);

  const [status, setStatus] = useState("");
  useEffect(() => {
    setStatus("");
    axios.get(`${getBackendURL()}/servers/${id}/status`, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    }).then((res) => setStatus(res.data));
  }, [id]);


  const StatusChecking = () => (
    <CAlert id="statusChecking" color="info">
      <CSpinner size="sm" /> Checking server status...
    </CAlert>
  )
  const StatusSuccess = () => (
    <CAlert id="statusSuccess" color="success">
      <CIcon icon={cilCheck} /> {status.message}
    </CAlert>
  )
  const StatusFail = () => (
    <CAlert id="statusFail" color="danger">
      <CIcon icon={cilWarning} /> {status.message}
    </CAlert>
  )

  const handleChange = (e) => {
    setMetadata({
      ...metadata,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.put(`${getBackendURL()}/servers/${id}`, metadata, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    })
      .then(res => { window.location.reload(); });
  };

  const [syncingVisible, setSyncingVisible] = useState(false);
  const [syncingSuccessVisible, setSyncingSuccessVisible] = useState(false);

  const syncScripts = async (e) => {
    setSyncingSuccessVisible(false);
    setSyncingVisible(true);
    await axios.post(`http://localhost:8000/servers/${id}/sync`, null, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    });
    setSyncingVisible(false);
    setSyncingSuccessVisible(true);
  };

  if (!siteReady) {
    return (<div className="pt-3 text-center">
      <CSpinner color="primary" variant="grow" />
    </div>)
  }

  return (
    <div className="flex-grow-1 d-flex flex-row gap-3 align-items-center justify-items-center" style={{ height: 0 }}>

      <div className="d-flex flex-column rounded-4 p-3" style={{ flex: 3 }}>

        <h1>{metadata.name}</h1>

        {status ? (status.code == 0 ? <StatusSuccess /> : <StatusFail />) : <StatusChecking />}

        <CForm onSubmit={handleSubmit}>
          <CFormInput className="mb-3"
            type="text"
            id="name"
            floatingLabel="Display name"
            value={metadata.name}
            onChange={handleChange}
          ></CFormInput>
          <CFormInput className="mb-3"
            type="text"
            id="hostname"
            floatingLabel="Hostname"
            value={metadata.hostname}
            onChange={handleChange}
          />
          <CFormInput className="mb-3"
            type="text"
            id="port"
            floatingLabel="Port"
            value={metadata.port}
            onChange={handleChange}
          />
          <CFormInput className="mb-3"
            type="text"
            id="username"
            floatingLabel="Username"
            value={metadata.username}
            onChange={handleChange}
          />
          <CButton color="primary" type="submit">
            Update configuration
          </CButton>
        </CForm>

      </div>
      <div className="d-flex flex-column" style={{ flex: 2 }}>

        <h2>Maintenance control</h2>
        <CContainer className="bg-body rounded-4 p-3">
          <div>Syncing will update or create Diffusion Lab files on the server without removing anything, and update Python environment. Dataset files are not affected by syncing.</div>
          <CButton className="mt-2" type="submit" color="primary" onClick={syncScripts}>
            <CSpinner size="sm" className="me-1" hidden={!syncingVisible} />
            <CIcon icon={cilCheck} className="me-1" hidden={!syncingSuccessVisible} />
            Sync environment
          </CButton>
        </CContainer>
        <CContainer className="bg-body rounded-4 p-3 mt-3">
          <div>Clearing cache will remove datasets, trained models, and all other Diffusion Lab files from the server, except the Python environment. Run sync to quickly install Diffusion Lab again.</div>
          <CButton className="mt-2" type="submit" color="primary">
            Clear cache
          </CButton>
        </CContainer>
        <CContainer className="bg-body rounded-4 p-3 mt-3">
          <div>Uninstalling will remove all Diffusion Lab files from the server. The server will also be removed from the dashboard.</div>
          <CButton className="mt-2" type="submit" color="primary">
            Uninstall environment
          </CButton>
        </CContainer>
      </div>
    </div>
  )
}

export default ServerDashboard

