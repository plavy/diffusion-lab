import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import classNames from 'classnames';
import axios from "axios";
import { getAuthHeader } from "../../utils";
import { CAlert, CButton, CForm, CFormInput, CSpinner } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilCheck, cilWarning } from "@coreui/icons";

const ServerDashboard = () => {

  const { id } = useParams();

  const [siteReady, setSiteReady] = useState(false);
  useEffect(() => {
    setSiteReady(false)
  }, [id])

  const [metadata, setMetadata] = useState("");
  useEffect(() => {
    axios.get("http://localhost:8000/servers/" + id, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    }).then((res) => { setMetadata(res.data); setSiteReady(true) });
  }, [id]);

  const [status, setStatus] = useState("");
  useEffect(() => {
    setStatus("");
    axios.get(`http://localhost:8000/servers/${id}/status`, {
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
  };

  const handleSubmit = (e) => {
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
    <>
      <h1>{metadata.name}</h1>

      {status ? (status.code == 0 ? <StatusSuccess /> : <StatusFail />) : <StatusChecking />}

      <CForm onSubmit={handleSubmit}>
        <CFormInput className="mb-3"
          type="text"
          id="id"
          label="ID"
          value={metadata.id}
          onChange={handleChange}
        ></CFormInput>
        <CFormInput className="mb-3"
          type="text"
          id="hostname"
          label="Hostname"
          value={metadata.hostname}
          onChange={handleChange}
        />
        <CFormInput className="mb-3"
          type="text"
          id="port"
          label="Port"
          value={metadata.port}
          onChange={handleChange}
        />
        <CFormInput className="mb-3"
          type="text"
          id="username"
          label="Username"
          value={metadata.username}
          onChange={handleChange}
        />
        <CButton color="primary" type="submit" className="mb-3">
          Save
        </CButton>
      </CForm>

      <div className="mt-2 flex-row gap-1">
        <CButton type="submit" color="primary" onClick={syncScripts}>
          <CSpinner size="sm" className="me-1" hidden={!syncingVisible}/>
          <CIcon icon={cilCheck} className="me-1" hidden={!syncingSuccessVisible}/>
          Sync environment
        </CButton>
        <CButton type="submit" color="primary">
          Reinstall environment
        </CButton>
        <CButton type="submit" color="primary">
          Clear cache
        </CButton>
      </div>

    </>
  )
}

export default ServerDashboard

