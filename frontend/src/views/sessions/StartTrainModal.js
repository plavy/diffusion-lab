import { useEffect, useRef, useState } from "react";
import { findName, getAuthHeader, getBackendURL, getDateTime, getLocal, shapeList, storeLocal, valProportionList } from "../../utils";
import { CAlert, CButton, CCol, CFormInput, CFormLabel, CFormSwitch, CImage, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CRow, CSpinner } from "@coreui/react";
import { cilCheck, cilWarning } from "@coreui/icons";
import LoadingButton from "../../components/LoadingButton";
import axios from "axios";
import CIcon from "@coreui/icons-react";
import LabelImage from "../../components/LabelImage";
import TranparentButton from "../../components/TransparentButton";
import ProgressPlaceholder from "../../components/ProgressPlaceholder";

const StartTrainModal = ({ modalVisible, setModalVisible, serverList, downsizingList, augmentationList, modelList, dataset }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [serverStatus, setServerStatus] = useState(null);
  const [serverStatusMessage, setServerStatusMessage] = useState(null);
  const [formData, setFormData] = useState({
    "dataset": "",
    "downsizing": "",
    "shape": "",
    "augmentations": {},
    "validationSplitProportion": "",
    "model": "",
    "hyperparameters": {},
    "sessionName": "",
    "sshServer": "",
  });
  const controller = useRef(new AbortController());
  const [imageSrcs, setImageSrcs] = useState({});
  const numberPreviewImages = 4;

  useEffect(() => {
    if (modalVisible) {
      let newFormData;
      if (getLocal('last-training')) {
        newFormData = { ...getLocal('last-training') };
      } else {
        newFormData = { ...formData };
        if (serverList.length > 0) {
          newFormData.sshServer = serverList[0].id;
        }
        if (downsizingList.length > 0) {
          newFormData.downsizing = downsizingList[0].id;
        }
        if (shapeList.length > 0) {
          newFormData.shape = shapeList[0].id;
        }
        if (augmentationList.length > 0) {
          newFormData.augmentations = Object.fromEntries(augmentationList.map(augmentation => [augmentation.id, false]));
        }
        if (valProportionList.length > 0) {
          newFormData.validationSplitProportion = valProportionList[0].id;
        }
        if (modelList.length > 0) {
          newFormData.model = modelList[0].id
          newFormData.hyperparameters = Object.fromEntries(modelList[0].hyperparameters.map(hp => [hp.id, hp.default]))
        }
      }
      newFormData.dataset = dataset;
      newFormData.sessionName = `model-${getDateTime()}`;
      setFormData(newFormData);
      setImageSrcs({});
    } else {
      controller.current.abort();
      setWaitingRespone(false);
      setErrorMessage("");
      setCurrentPage(0);
      setServerStatus(null);
      setServerStatusMessage(null);
      setImageSrcs({});
    }
  }, [modalVisible]);

  const ServerStatus = () => (
    serverStatusMessage != null ? (

      serverStatus != null ? (serverStatus == 0 ?
        <div className="text-success">
          <CIcon icon={cilCheck} /> {serverStatusMessage}
        </div> :
        <div className="text-danger">
          <CIcon icon={cilWarning} /> {serverStatusMessage}
        </div>)
        : <div className="text-info">
          <CSpinner size="sm" /> {serverStatusMessage}
        </div>
    ) : null
  )

  const getImagePreviews = () => {
    setImageSrcs({});
    if (serverStatus == 0) {
      const timestamp = Date.now();
      axios.post(`${getBackendURL()}/servers/${formData.sshServer}/preview/${timestamp}`, formData, {
        // signal: controller.current.signal,
        headers: {
          Authorization: getAuthHeader() // Encrypted by TLS
        }
      })
        .then(_ => {
          for (let i = 0; i < numberPreviewImages; i++) {
            axios.get(`${getBackendURL()}/servers/${formData.sshServer}/preview/${timestamp}/image/${i}`, {
              // signal: controller.current.signal,
              headers: {
                Authorization: getAuthHeader() // Encrypted by TLS
              },
              responseType: 'blob', // Fetch as binary
            })
              .then(res => {
                setImageSrcs(imageSrcs => ({ ...imageSrcs, [i]: URL.createObjectURL(res.data) }))
              })
              .catch(error => {
                if (error.code != 'ERR_CANCELED') {
                }
              });

          }
        })
        .catch((error) => {
          if (error.code != 'ERR_CANCELED') {
          }
        }
        );
    }
  }
  useEffect(() => {
    getImagePreviews();
  }, [serverStatus]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleRadioChange = (key, value) => {
    setFormData({
      ...formData,
      [key]: value,
    });
  };

  const handleModelChange = (value) => {
    setFormData({
      ...formData,
      model: value,
      hyperparameters: Object.fromEntries(modelList.find(model => model.id == value).hyperparameters.map(hp => [hp.id, hp.default])),
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
    storeLocal('last-training', formData)
    axios.post(`${getBackendURL()}/servers/${formData.sshServer}/train`, formData, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    })
      .then(_ => { setModalVisible(false) })
      .catch(error => {
        setErrorMessage(error.response.data);
        setWaitingRespone(false);
      });
  }

  const handleNextPage = () => {
    if (currentPage == 0) {
      setServerStatus(null);
      setServerStatusMessage(`Syncing ${findName(serverList, formData.sshServer)}...`)
      axios.post(`${getBackendURL()}/servers/${formData.sshServer}/sync`, null, {
        headers: {
          Authorization: getAuthHeader() // Encrypted by TLS
        }
      }).then((_) => {
        setServerStatus(0);
        setServerStatusMessage(`${findName(serverList, formData.sshServer)} ready`);
      }).catch((_) => {
        setServerStatus(1);
        setServerStatusMessage(`${findName(serverList, formData.sshServer)} couldn't be synced`);
      });
    }
    if (currentPage == 2) {
      getImagePreviews();
    }
    if (currentPage == pages.length - 2) {
      setFormData({
        ...formData,
        sessionName: `model-${getDateTime()}`
      });
    }
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const ImagesPreview = () => {
    let images = []
    for (let i = 0; i < numberPreviewImages; i++) {
      if (imageSrcs[i]) {
        images.push(<CCol className="text-center p-1" key={i}><CImage className="w-100" fluid src={imageSrcs[i]} /></CCol>)
      } else {
        images.push(<CCol className="text-center p-1" key={i}><ProgressPlaceholder progress={80} color_left="var(--cui-secondary)" color_right="var(--cui-body-bg)" /></CCol>)
      }
    }
    return images;
  }

  const pages = [
    {
      content: (
        <div className="d-flex flex-column gap-3 align-items-center justify-content-center" >
          <div>
            <CFormLabel className="w-100 text-center">SSH server</CFormLabel>
            <div className="d-flex flex-row flex-wrap gap-2 justify-content-center">
              {serverList.map(
                server => <LabelImage
                  key={server.id}
                  svg={server.icon}
                  label={server.name}
                  onClick={() => handleRadioChange('sshServer', server.id)}
                  selected={server.id == formData.sshServer} />
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      content: (
        <div className="d-flex flex-column gap-3 align-items-center justify-content-center">

          <div>
            <CFormLabel className="w-100 text-center">Downsizing method</CFormLabel>
            <div className="d-flex flex-row flex-wrap gap-2 justify-content-center">
              {downsizingList.map(
                downsizing => <LabelImage
                  key={downsizing.id}
                  svg={downsizing.icon}
                  label={downsizing.name}
                  onClick={() => handleRadioChange('downsizing', downsizing.id)}
                  selected={downsizing.id == formData.downsizing} />
              )}
            </div>
          </div>
          <div>
            <CFormLabel className="w-100 text-center">Shape</CFormLabel>
            <div className="d-flex flex-row flex-wrap gap-2 justify-content-center">
              {shapeList.map(
                shape => <TranparentButton
                  key={shape.id}
                  label={shape.name}
                  onClick={() => handleRadioChange('shape', shape.id)}
                  selected={shape.id == formData.shape} />
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      content: (
        <div className="d-flex flex-column gap-3 align-items-center justify-content-center" >
          <div>
            <CFormLabel className="w-100 text-center">Augmentation methods</CFormLabel>
            {augmentationList.map(augmentation => (
              <CFormSwitch
                key={augmentation.id}
                id={augmentation.id}
                label={augmentation.name}
                checked={formData["augmentations"][augmentation.id]}
                onChange={handleAugmentationChange}
                color="primary"
              />
            ))}
          </div>
          <div>
            <CFormLabel className="w-100 text-center">Validation split proportion</CFormLabel>
            <div className="d-flex flex-row flex-wrap gap-2 justify-content-center">
              {valProportionList.map(
                vp => <TranparentButton
                  key={vp.id}
                  label={vp.name}
                  onClick={() => handleRadioChange('validationSplitProportion', vp.id)}
                  selected={vp.id == formData.validationSplitProportion} />
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      content: (
        <div>
          <CFormLabel className="w-100 text-center">Model</CFormLabel>
          <div className="d-flex flex-row flex-wrap gap-2 justify-content-center">
            {modelList.map(
              model => <LabelImage
                key={model.id}
                svg={model.icon}
                label={model.name}
                onClick={() => handleModelChange(model.id)}
                selected={model.id == formData.model}></LabelImage>
            )}
          </div>
        </div>
      )
    },
    {
      content: (
        <div style={{ minWidth: '400px' }}>
          <CFormLabel className="w-100 text-center">Hyperparameters</CFormLabel>
          {modelList.find(model => model.id == formData.model)?.hyperparameters.map(hp =>
          (
            <CFormInput className="mt-2"
              key={hp.id}
              id={hp.id}
              type="text"
              floatingLabel={hp.name}
              value={formData["hyperparameters"][hp.id]}
              onChange={handleHyperparameterChange}
            />
          ))}
        </div>
      )
    },
    {
      content: (
        <div className="w-100 d-flex flex-column gap-3 align-items-center justify-content-center" >
          <div className="border rounded p-2 w-100" style={{ maxWidth: '400px' }}>
            Downsizing: {findName(downsizingList, formData.downsizing)} {findName(shapeList, formData.shape)}
            <br />
            Augmentations: {Object.entries(formData.augmentations).filter(([key, value]) => value == true).length == 0 ? (<>None</>) :
              Object.entries(formData.augmentations).filter(([key, value]) => value == true).map(([key, value]) => (<span key={key}><br /> - {findName(augmentationList, key)}</span>))
            }
            <br />
            Validation split proportion: {findName(valProportionList, formData.validationSplitProportion)}
            <br />
            Model: {findName(modelList, formData.model)}
            <br />
            Hyperparameters: {Object.keys(formData.hyperparameters).length == 0 ? (<>None</>) :
              Object.entries(formData.hyperparameters).map(([key, value]) => (<span key={key}><br /> - {findName(modelList.find(model => model.id == formData.model)?.hyperparameters, key)}: {value}</span>))
            }
          </div>
          <div className="w-100" style={{ maxWidth: '400px' }}>
            <CFormInput
              className="w-100"
              id="sessionName"
              type="text"
              floatingLabel="Session name"
              value={formData["sessionName"]}
              onChange={handleChange}
            />
          </div>
          <div className="w-100" style={{ maxWidth: '400px' }}>
            <CFormLabel className="w-100 text-center">Preview of training samples</CFormLabel>
            <CRow xs={{ cols: 4 }}>
              <ImagesPreview />
            </CRow>
          </div>
        </div>
      )
    }
  ]

  return <CModal
    scrollable
    visible={modalVisible}
    aria-hidden={false}
    onClose={() => setModalVisible(false)}
    size="lg"
  >
    <CModalHeader>
      <CModalTitle>New training</CModalTitle>
    </CModalHeader>
    <CModalBody className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '400px' }}>
      {errorMesage ? <CAlert color="danger" ><CIcon className="me-1" icon={cilWarning} />{errorMesage}</CAlert> : null}
      {pages[currentPage].content}
    </CModalBody>
    <CModalFooter>
      <ServerStatus />
      <div className="flex-grow-1"></div>

      {currentPage > 0 ?
        <CButton color="secondary" onClick={handlePrevPage}>Previous</CButton> :
        <CButton color="secondary" onClick={() => setModalVisible(false)}>Cancel</CButton>
      }
      {currentPage < pages.length - 1 ?
        <CButton color="primary" onClick={handleNextPage}>Next</CButton> :
        <LoadingButton
          loadingVisible={watingResponse}
          disabled={serverStatus != 0}
          color="primary"
          type="submit"
          onClick={handleSubmit}
        >Start training</LoadingButton>
      }
    </CModalFooter>
  </CModal>
}

export default StartTrainModal;