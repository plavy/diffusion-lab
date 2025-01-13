import { CAlert, CButton, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CSpinner } from "@coreui/react";
import { getAuthHeader, getBackendURL } from "../../utils";
import { useEffect, useState } from "react";
import axios from "axios";
import CIcon from "@coreui/icons-react";
import { cilWarning } from "@coreui/icons";
import TrainingGraph from "../../components/TrainingGraph";


const DetailsModal = ({ modalVisible, setModalVisible, session, dataset }) => {
  const [watingResponse, setWaitingRespone] = useState(true);
  const [errorMesage, setErrorMessage] = useState("");
  const [metrics, setMetrics] = useState("");

  const getLogs = async () => {
    setWaitingRespone(true);
    setErrorMessage("");
    axios.get(`${getBackendURL()}/datasets/${dataset}/models/${session.sessionName}/metrics`, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    })
      .then(res => { setMetrics(res.data); setWaitingRespone(false); })
      .catch(error => {
        setErrorMessage(error.response.data)
        setWaitingRespone(false);
      });
  }

  useEffect(() => {
    if (modalVisible) {
      getLogs();
    } else {
      setWaitingRespone(false);
      setErrorMessage("");
    }
  }, [modalVisible]);

  return <CModal
    scrollable
    visible={modalVisible}
    onClose={() => setModalVisible(false)}
    size="xl"
  >

    <CModalHeader>
      <CModalTitle>Details</CModalTitle>
    </CModalHeader>
    <CModalBody>
      {errorMesage ? <CAlert color="danger" ><CIcon className="me-1" icon={cilWarning} />{errorMesage}</CAlert> : null}
      {watingResponse ? <div className="w-100 d-flex flex-column jutify-items-center align-items-center">
        <CSpinner color="primary" variant="grow" />
      </div>
        : <>
        <TrainingGraph epoch={metrics.epoch} trainLoss={metrics.train_loss} valLoss={metrics.val_loss}/>
        </>}
      
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" onClick={() => setModalVisible(false)}>Close</CButton>
    </CModalFooter>
  </CModal>
}

export default DetailsModal;