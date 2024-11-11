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

  const [metadata, setMetadata] = useState("");
  useEffect(() => {
    axios.get("http://localhost:8000/servers/" + id, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    }).then((res) => setMetadata(res.data));
  }, [id]);

  const [status, setStatus] = useState("");
  useEffect(() => {
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

      <CButton type="submit" color="primary" className="mt-2">
        Prepare or update environment
      </CButton>

    </>
  )
}

export default ServerDashboard

