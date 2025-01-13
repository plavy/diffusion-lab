import { CButton, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from "@coreui/react";
import { getAuthHeader, getBackendURL } from "../../utils";
import LoadingButton from "../../components/LoadingButton";
import { useEffect, useState } from "react";
import axios from "axios";

const StopTrainModal = ({ modalVisible, setModalVisible, session }) => {

  const [watingResponse, setWaitingRespone] = useState(false);
  const [errorMesage, setErrorMessage] = useState("");
  const stopTraining = async () => {
    setWaitingRespone(true);
    axios.delete(`${getBackendURL()}/servers/${session.server}/train/${session.sessionName}`, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    })
      .then(res => { setModalVisible(false) })
      .catch(error => {
        setErrorMessage(error.response.data)
        setWaitingRespone(false);
      });
  }

  useEffect(() => {
    if (modalVisible) {
    } else {
      setWaitingRespone(false);
      setErrorMessage("");
    }
  }, [modalVisible]);

  return <CModal
    scrollable
    visible={modalVisible}
    onClose={() => setModalVisible(false)}
  >
    <CModalHeader>
      <CModalTitle>Stop training</CModalTitle>
    </CModalHeader>
    <CModalBody>
      {errorMesage ? <CAlert color="danger" ><CIcon className="me-1" icon={cilWarning} />{errorMesage}</CAlert> : null}
      <p>Are you sure you want to stop training {session ? session.sessionName : null}?</p>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" onClick={() => setModalVisible(false)}>Cancel</CButton>
      <LoadingButton loadingVisible={watingResponse} color="primary" onClick={() => stopTraining()}>Stop training</LoadingButton>
    </CModalFooter>
  </CModal>
}

export default StopTrainModal;