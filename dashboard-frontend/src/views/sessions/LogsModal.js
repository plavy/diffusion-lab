import { CAlert, CButton, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CSpinner } from "@coreui/react";
import { getAuthHeader, getBackendURL } from "../../utils";
import { useEffect, useState } from "react";
import axios from "axios";
import CIcon from "@coreui/icons-react";
import { cilWarning } from "@coreui/icons";


const LogsModal = ({ modalVisible, setModalVisible, session, server }) => {
  const [watingResponse, setWaitingRespone] = useState(true);
  const [errorMesage, setErrorMessage] = useState("");
  const [logs, setLogs] = useState("");

  const getLogs = async () => {
    setWaitingRespone(true);
    axios.get(`${getBackendURL()}/servers/${server}/train/${session.sessionName}/logs`, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    })
      .then(res => { setLogs(res.data); setWaitingRespone(false); })
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
    size="lg"
  >

    <CModalHeader>
      <CModalTitle>Logs</CModalTitle>
    </CModalHeader>
    <CModalBody>
      {errorMesage ? <CAlert color="danger" ><CIcon className="me-1" icon={cilWarning} />{errorMesage}</CAlert> : null}
      {watingResponse ? <div className="w-100 d-flex flex-column jutify-items-center align-items-center">
        <CSpinner color="primary" variant="grow" />
      </div>
        : null}
      {logs}
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" onClick={() => setModalVisible(false)}>Close</CButton>
    </CModalFooter>
  </CModal>
}

export default LogsModal;