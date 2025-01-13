import { useEffect, useState } from "react";
import { getAuthHeader, getBackendURL, getDateTime, getLocal, storeLocal } from "../../utils";
import { CAlert, CButton, CForm, CFormInput, CFormSelect, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from "@coreui/react";
import { cilWarning } from "@coreui/icons";
import LoadingButton from "../../components/LoadingButton";
import axios from "axios";
import CIcon from "@coreui/icons-react";

const StartTrainModal = ({ modalVisible, setModalVisible, serverList, dataset }) => {
  const [formData, setFormData] = useState({
    "dataset": dataset,
    "preprocessing": "crop",
    "model": "pixel-diffusion",
    "hyperparameter:learningRate": "1e-10",
    "hyperparameter:maxSteps": "100",
    "sessionName": "",
    "sshServer": "",
  });

  useEffect(() => {
    if (modalVisible) {
      const newFormData = { ...formData };
      if (serverList.length > 0) {
        const lastTrainServer = getLocal('last-train-server');
        if (lastTrainServer && serverList.some(server => server.id === lastTrainServer)) {
          newFormData["sshServer"] = lastTrainServer;
        } else {
          newFormData["sshServer"] = serverList[0].id;
        }
      }
      newFormData["sessionName"] = `model-${getDateTime()}`;
      setFormData(newFormData);
    } else {
      setWaitingRespone(false);
      setErrorMessage("");
    }
  }, [modalVisible]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const [watingResponse, setWaitingRespone] = useState(false);
  const [errorMesage, setErrorMessage] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    setWaitingRespone(true);
    setErrorMessage("");
    storeLocal('last-train-server', formData.sshServer);
    axios.post(`${getBackendURL()}/servers/${formData.sshServer}/train`, formData, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    })
      .then(res => { setModalVisible(false) })
      .catch(error => {
        setErrorMessage(error.response.data);
        setWaitingRespone(false);  
      });
  }

  return <CModal
    scrollable
    visible={modalVisible}
    onClose={() => setModalVisible(false)}
    size="lg"
  >
    <CModalHeader>
      <CModalTitle>Train</CModalTitle>
    </CModalHeader>
    <CModalBody>
      {errorMesage ? <CAlert color="danger" ><CIcon className="me-1" icon={cilWarning} />{errorMesage}</CAlert> : null}
      <CForm id="trainConfig">
        <CFormSelect
          id="preprocessing"
          floatingLabel="Preprocessing"
          options={[
            { label: 'Crop', value: 'crop' },
            { label: 'Two', value: 'two' },
            { label: 'Three', value: 'three' }
          ]}
          onChange={handleChange}
        />
        <CFormSelect className="mt-2"
          id="model"
          floatingLabel="Model"
          options={[
            { label: 'Pixel diffusion', value: 'pixel-diffusion' },
            { label: 'Latent diffusion', value: 'latent-diffusion' },
          ]}
          onChange={handleChange}
        />
        <CFormInput className="mt-2"
          id="hyperparameter:learningRate"
          type="text"
          floatingLabel="Learning rate"
          value={formData["hyperparameter:learningRate"]}
          onChange={handleChange}
        />
        <CFormInput className="mt-2"
          id="hyperparameter:maxSteps"
          type="text"
          floatingLabel="Max steps"
          value={formData["hyperparameter:maxSteps"]}
          onChange={handleChange}
        />
        <CFormInput className="mt-2"
          id="sessionName"
          type="text"
          floatingLabel="Session name"
          value={formData["sessionName"]}
          onChange={handleChange}
        />
        <CFormSelect className="mt-2"
          id="sshServer"
          floatingLabel="SSH server"
          options={serverList.map(server => ({
            label: server.name,
            value: server.id
          }))}
          value={formData["sshServer"]}
          onChange={handleChange}
        />
      </CForm>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" onClick={() => setModalVisible(false)}>Cancel</CButton>
      <LoadingButton loadingVisible={watingResponse} color="primary" type="submit" onClick={handleSubmit}>Start training</LoadingButton>
    </CModalFooter>
  </CModal>
}

export default StartTrainModal;