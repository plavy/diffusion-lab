import { CButton, CForm, CFormInput, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CSpinner } from "@coreui/react"
import axios from "axios";
import { getAuthHeader, getBackendURL, updateServerList } from "../../utils";
import { useState } from "react";
import { useNavigate } from "react-router-dom";


const NewServerModal = ({ modalVisible, setModalVisible }) => {
  const [watingResponse, setWaitingRespone] = useState(false);
  const [formData, setFormData] = useState({
    "name": "",
    "hostname": "",
    "port": "",
    "username": "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
  });
  };

  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    setWaitingRespone(true);
    axios.post(`${getBackendURL()}/servers`, formData, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    })
      .then(res => { navigate(`/servers/${res.data.id}`) });
  };

  return (

    <CModal
      scrollable
      visible={modalVisible}
      onClose={() => setModalVisible(false)}
      aria-labelledby="NewServerModal"
    >
      <CModalHeader>
        <CModalTitle id="NewServerModal">Add new server</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm id="form" onSubmit={handleSubmit}>
          <CFormInput className="mb-3"
            type="text"
            id="name"
            floatingLabel="Display name"
            placeholder=""
            onChange={handleChange}
          ></CFormInput>
          <CFormInput className="mb-3"
            type="text"
            id="hostname"
            floatingLabel="Hostname"
            placeholder=""
            onChange={handleChange}
          />
          <CFormInput className="mb-3"
            type="text"
            id="port"
            floatingLabel="Port"
            placeholder=""
            onChange={handleChange}
          />
          <CFormInput className="mb-3"
            type="text"
            id="username"
            floatingLabel="Username"
            placeholder=""
            onChange={handleChange}
          />
        </CForm>

      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={() => setModalVisible(false)}>Cancel</CButton>
        <CButton color="primary" type="submit" disabled={watingResponse} onClick={handleSubmit}>
          {watingResponse ? <CSpinner className="me-1" size="sm" /> : null}Add new server</CButton>
      </CModalFooter>
    </CModal>
  )
}

export default NewServerModal