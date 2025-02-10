import { CAlert, CButton, CFormCheck, CFormSwitch, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CSpinner } from "@coreui/react";
import { findName, getAuthHeader, getBackendURL, shapeList, valProportionList } from "../../utils";
import { useEffect, useState } from "react";
import axios from "axios";
import CIcon from "@coreui/icons-react";
import { cilWarning } from "@coreui/icons";
import TrainingGraph from "../../components/TrainingGraph";


const DetailsModal = ({ modalVisible, setModalVisible, serverList, downsizingList, augmentationList, modelList, session, dataset }) => {
  const [watingResponse, setWaitingRespone] = useState(true);
  const [errorMesage, setErrorMessage] = useState("");
  const [metrics, setMetrics] = useState(null);
  const [clearView, setClearView] = useState(true);

  // Start, end, duration of training

  const getMetrics = async () => {
    setWaitingRespone(true);
    setErrorMessage("");
    const metricsUrl = session.uploadDone ? `${getBackendURL()}/datasets/${dataset}/sessions/${session.sessionName}/metrics`
      : `${getBackendURL()}/servers/${session.sshServer}/train/${session.sessionName}/metrics?dataset=${dataset}`
    axios.get(metricsUrl, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    })
      .then(res => {
        setMetrics(res.data);
        setWaitingRespone(false);
      })
      .catch(error => {
        setErrorMessage(error.response.data)
        setWaitingRespone(false);
      });
  }

  useEffect(() => {
    if (modalVisible) {
      getMetrics();
    } else {
      setWaitingRespone(false);
      setErrorMessage("");
      setMetrics(null);
    }
  }, [modalVisible]);

  const handleClearViewChange = (e) => {
    setClearView(e.target.checked);
  }

  return <CModal
    scrollable
    visible={modalVisible}
    onClose={() => setModalVisible(false)}
    size="xl"
  >
    <CModalHeader>
      <CModalTitle>Details for {session?.sessionName}</CModalTitle>
    </CModalHeader>
    <CModalBody>
      {errorMesage ? <CAlert color="danger" ><CIcon className="me-1" icon={cilWarning} />{errorMesage}</CAlert> : null}
      {watingResponse ? <div className="w-100 d-flex flex-column jutify-items-center align-items-center">
        <CSpinner color="primary" variant="grow" />
      </div>
        : null
      }
      {metrics ? <div className="d-flex flex-row gap-1 flex-wrap jutify-items-center align-items-center">
        <div className="border rounded p-2">
          Downsizing: {findName(downsizingList, session.downsizing)} {findName(shapeList, session.shape)}
          <br />
          Augmentations: {Object.entries(session.augmentations).filter(([key, value]) => value == true).length == 0 ? (<>None</>) :
            Object.entries(session.augmentations).filter(([key, value]) => value == true).map(([key, value]) => (<span key={key}><br /> - {findName(augmentationList, key)}</span>))
          }
          <br />
          Validation split proportion: {findName(valProportionList, session.validationSplitProportion)}
          <br />
          Model: {findName(modelList, session.model)}
          <br />
          Hyperparameters: {Object.keys(session.hyperparameters).length == 0 ? (<>None</>) :
            Object.entries(session.hyperparameters).map(([key, value]) => (<span key={key}><br /> - {findName(modelList.find(model => model.id == session.model)?.hyperparameters, key)}: {value}</span>))
          }
          <br />
          SSH server: {findName(serverList, session.sshServer)}
          <br />
          Steps done: {Number(metrics.step?.at(-1)) + 1}
        </div>
        <TrainingGraph className="flex-grow-1" epoch={metrics.epoch} trainLoss={metrics.train_loss} valLoss={metrics.val_loss} clearView={clearView} />
      </div>
        : null
      }
    </CModalBody>
    <CModalFooter>
      <CFormSwitch id="clear-view-check2" className="me-1" label="Clear view" checked={clearView} onChange={handleClearViewChange} />
      <div className="separator flex-grow-1"></div>
      <CButton color="secondary" onClick={() => setModalVisible(false)}>Close</CButton>
    </CModalFooter>
  </CModal>
}

export default DetailsModal;