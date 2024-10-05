import React, { useState, useEffect } from "react";
import classNames from 'classnames'

const DatasetDashboard = () => {

  const [message, setMessage] = useState("");
  useEffect(() => {
    fetch("http://localhost:8000/datasets")
      .then((res) => res.json())
      .then((data) => setMessage(data));
  }, []);

  return (
    <>
      <div>Ahoj: {message} /</div>
    </>
  )
}

export default DatasetDashboard

