import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import classNames from 'classnames';
import axios from "axios";
import { getAuthHeader } from "../../utils";
import { CAlert, CButton, CSpinner } from "@coreui/react";
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

  return (
    <>
      <h1>{metadata.name}</h1>

      <CAlert id="statusChecking" color="info">
        <CSpinner size="sm"/> Checking server status...
      </CAlert>
      <CAlert id="statusSuccess" color="success">
        <CIcon icon={cilCheck}/> Server is reachable
      </CAlert>
      <CAlert id="statusUnreachable" color="danger">
        <CIcon icon={cilWarning}/> Server is unreachable
      </CAlert>
      <CAlert id="statusAuthFail" color="danger">
        <CIcon icon={cilWarning}/> Authentication is not working
      </CAlert>

      <div>ID: {metadata.id}</div>
      <div>Hostname: {metadata.hostname}</div>
      <div>Port: {metadata.port}</div>
      <div>Username: {metadata.username}</div>

      <CButton type="submit" color="primary" className="mt-2">
        Prepare or update environment
      </CButton>

    </>
  )
}

export default ServerDashboard

