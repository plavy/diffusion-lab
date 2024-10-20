import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import classNames from 'classnames';
import axios from "axios";
import { getAuthHeader } from "../../utils";

const DatasetDashboard = () => {
  
  const { id } = useParams();
  const [metadata, setMetadata] = useState("");
  useEffect(() => {
    axios.get("http://localhost:8000/datasets/" + id, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    }).then((res) => setMetadata(res.data));
  }, []);

  return (
    <>
      <h1>{metadata.name}</h1>
      <div>ID: {metadata.id}</div>
      <div>Author: {metadata.author}</div>
      <div>path id: {id}</div>
    </>
  )
}

export default DatasetDashboard

