import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import classNames from 'classnames'

const DatasetDashboard = () => {
  
  const { id } = useParams();
  const [message, setMessage] = useState("");
  useEffect(() => {
    fetch("http://localhost:8000/datasets")
      .then((res) => res.json())
      .then((data) => setMessage(data));
  }, []);

  return (
    <>
      <div>Ahoj: {id}</div>
    </>
  )
}

export default DatasetDashboard

