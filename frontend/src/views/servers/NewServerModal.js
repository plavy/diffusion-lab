import { CButton, CForm, CFormInput, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CSpinner } from "@coreui/react"
import axios from "axios";
import { getAuthHeader, getBackendURL, updateServerList } from "../../utils";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingButton from "../../components/LoadingButton";


const NewServerModal = ({ modalVisible, setModalVisible }) => {
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
  
  const [watingResponse, setWaitingRespone] = useState(false);
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

  useEffect(() => {
    if (! modalVisible) {
      setWaitingRespone(false);
    }
  }, [modalVisible]);

  return (

    <CModal
      scrollable
      visible={modalVisible}
      onClose={() => setModalVisible(false)}
      aria-labelledby="NewServerModal"
    >
      <CModalHeader>
        <CModalTitle id="NewServerModal">New server</CModalTitle>
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
        <LoadingButton color="primary" type="submit" loadingVisible={watingResponse} onClick={handleSubmit}>
        Add new server
        </LoadingButton>
      </CModalFooter>
    </CModal>
  )
}

export default NewServerModal