import { useEffect, useState } from "react";
import { getAuthHeader, getBackendURL, getDateTime, getLocal, storeLocal } from "../../utils";
import { CAlert, CButton, CForm, CFormInput, CFormLabel, CFormSelect, CFormSwitch, CInputGroup, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from "@coreui/react";
import { cilWarning } from "@coreui/icons";
import LoadingButton from "../../components/LoadingButton";
import axios from "axios";
import CIcon from "@coreui/icons-react";

const StartTrainModal = ({ modalVisible, setModalVisible, serverList, downsizingList, augmentationList, modelList, dataset }) => {
  const [formData, setFormData] = useState({
    "dataset": "",
    "downsizing": "",
    "shape": "",
    "augmentations": {},
    "model": "",
    "hyperparameters": {},
    "sessionName": "",
    "sshServer": "",
  });

  const shapeList = [
    {
      label: "64x64",
      value: "64x64"
    },
    {
      label: "128x128",
      value: "128x128"
    },
    {
      label: "256x256",
      value: "256x256"
    }
  ]

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
      if (downsizingList.length > 0) {
        newFormData["downsizing"] = downsizingList[0].id;
      }
      if (shapeList.length > 0) {
        newFormData["shape"] = shapeList[0].value;
      }
      if (augmentationList.length > 0) {
        newFormData["augmentations"] = Object.fromEntries(augmentationList.map(augmentation => [augmentation.id, false]));
      }
      if (modelList.length > 0) {
        newFormData["model"] = modelList[0].id
        newFormData["hyperparameters"] = Object.fromEntries(modelList[0].hyperparameters.map(hp => [hp.id, hp.default]))
      }
      newFormData["dataset"] = dataset;
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

  const handleModelChange = (e) => {
    setFormData({
      ...formData,
      model: e.target.value,
      hyperparameters: Object.fromEntries(modelList.find(model => model.id == e.target.value).hyperparameters.map(hp => [hp.id, hp.default])),
    });
  };

  const handleAugmentationChange = (e) => {
    setFormData({
      ...formData,
      augmentations: {
        ...formData.augmentations,
        [e.target.id]: e.target.checked,
      }
    });
  };

  const handleHyperparameterChange = (e) => {
    setFormData({
      ...formData,
      hyperparameters: {
        ...formData.hyperparameters,
        [e.target.id]: e.target.value,
      }
    });
  }

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
        <CInputGroup>
          <CFormSelect
            id="downsizing"
            floatingLabel="Downsizing method"
            options={downsizingList.map(downsizing => ({
              label: downsizing.name,
              value: downsizing.id
            }))}
            onChange={handleChange}
          />
          <CFormSelect
            id="shape"
            floatingLabel="Shape"
            options={shapeList}
            onChange={handleChange}
          />
        </CInputGroup>
        <div className="form-floating">
          <div className="form-control mt-2" style={{ height: 'unset', paddingTop: '2rem' }}>
            {augmentationList.map(augmentation => (
              <CFormSwitch
                key={augmentation.id}
                id={augmentation.id}
                label={augmentation.name}
                checked={formData["augmentations"][augmentation.id]}
                onChange={(e) => handleAugmentationChange(e)}
                color="primary"
              />
            ))}
          </div>
          <CFormLabel>Augmentation methods</CFormLabel>
        </div>
        <CFormSelect className="mt-2"
          id="model"
          floatingLabel="Model"
          options={modelList.map(model => ({
            label: model.name,
            value: model.id
          }))}
          value={formData["model"]}
          onChange={handleModelChange}
        />
        {modelList.filter(model => model.id == formData["model"]).map(model => (
          model["hyperparameters"].map(hp =>
          (
            <CFormInput className="mt-2"
              key={hp.id}
              id={hp.id}
              type="text"
              floatingLabel={hp.name}
              value={formData["hyperparameters"][hp.id]}
              onChange={handleHyperparameterChange}
            />
          ))
        ))}
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