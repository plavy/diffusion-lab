import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import classNames from 'classnames';
import axios from "axios";
import { getAuthHeader } from "../../utils";

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
      <div>ID: {metadata.id}</div>
      <div>Hostname: {metadata.hostname}</div>
      <div>Port: {metadata.port}</div>
      <div>Username: {metadata.username}</div>
    </>
  )
}

export default ServerDashboard

