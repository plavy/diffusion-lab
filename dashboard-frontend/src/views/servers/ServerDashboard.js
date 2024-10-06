import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import classNames from 'classnames'

const ServerDashboard = () => {

  const { id } = useParams();
  const [message, setMessage] = useState("");
  useEffect(() => {
    fetch("http://localhost:8000/servers/" + id)
      .then((res) => res.json())
      .then((data) => setMessage(data));
  }, []);

  return (
    <>
      <div>Ahoj: {JSON.stringify(message)} /</div>
    </>
  )
}

export default ServerDashboard

