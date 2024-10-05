import React, { useState, useEffect } from "react";
import classNames from 'classnames'

const DatasetDashboard = () => {

  const [message, setMessage] = useState("");
  useEffect(() => {
    fetch("http://localhost:8000/servers")
      .then((res) => res.json())
      .then((data) => setMessage(data));
  }, []);

  return (
    <>
      <div>Ahoj: {JSON.stringify(message)} /</div>
    </>
  )
}

export default DatasetDashboard

