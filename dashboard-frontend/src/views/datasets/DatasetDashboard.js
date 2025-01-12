import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import classNames from 'classnames';
import axios from "axios";
import { getAuthHeader, getBackendURL, getDateTime, getLocal, storeLocal, updateDatasetList, updateServerList } from "../../utils";
import { useSelector, useDispatch } from 'react-redux';

import {
  CButton,
  CAccordion,
  CAccordionItem,
  CAccordionHeader,
  CAccordionBody,
  CModal,
  CModalTitle,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CFormSelect,
  CForm,
  CFormInput,
  CBadge,
  CContainer,
  CRow,
  CCol,
  CImage,
  CSpinner,
  CProgress,
  CPlaceholder
} from "@coreui/react";
import LoadingButton from "../../components/LoadingButton";
import StartTrainModal from "../sessions/StartTrainModal";
import StopTrainModal from "../sessions/StopTrainModal";


const DatasetDashboard = () => {
  const dispatch = useDispatch();

  const { id } = useParams();

  const [siteReady, setSiteReady] = useState(false);

  const [generateVisible, setGenerateVisible] = useState(false);
  const [generateFormVisible, setGenerateFormVisible] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [generateProgressRequestParam, setGenerateProgressRequestParam] = useState(null);
  const [startTrainVisible, setStartTrainVisible] = useState(false);
  const [stopTrainVisible, setStopTrainVisible] = useState(false);
  const [stopTrainSessionName, setStopTrainSessionName] = useState(null);
  const [deleteTrainVisible, setDeleteTrainVisible] = useState(false);
  const [deleteTrainSessionName, setDeleteTrainSessionName] = useState(null);

  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedServer, setSelectedServer] = useState(null);

  const [trainedModels, setTrainedModels] = useState([]);
  const [trainedModelsReady, setTrainedModelsReady] = useState(false);
  const [activeAccordionItem, setActiveAccordionItem] = useState(null);

  const [imageSrcList, setImageSrcList] = useState([]);
  const [generatedImageSrcList, setGeneratedImageSrcList] = useState([]);

  const autoRefresh = useSelector((state) => state.autoRefresh)
  const serverList = useSelector((state) => state.serverList);

  
  useEffect(() => {
    const servers = getLocal('servers');
    if (servers) {
      dispatch({ type: 'set', serverList: servers });
      // setStartSSHServer(servers);
    }
    axios.get(`${getBackendURL()}/servers`, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    })
    .then((res) => {
      dispatch({ type: 'set', serverList: res.data });
      storeLocal('servers', res.data);
      // setStartSSHServer(res.data);
    });
  }, []);

  useEffect(() => {
    setSiteReady(false);
    setTrainedModelsReady(false);
  }, [id]);

  // Metadata
  const [metadata, setMetadata] = useState("");
  useEffect(() => {
    const getMetadata = () => {
      axios.get(`${getBackendURL()}/datasets/${id}`, {
        headers: {
          Authorization: getAuthHeader() // Encrypted by TLS
        }
      }).then((res) => { setMetadata(res.data); setSiteReady(true); });
    }

    try {
      const filtered = getLocal('datasets').filter(dataset => dataset.id == id);
      if (filtered.length == 1) {
        setMetadata(filtered[0]);
        setSiteReady(true);
        getMetadata();
      } else {
        throw new Error();
      }
    } catch {
      getMetadata();
    }
  }, [id]);

  useEffect(() => {
    setImageSrcList([]);
    axios.get(`${getBackendURL()}/datasets/${id}/images/train`, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    })
      .then(res => {
        const images = res.data;
        for (let i = 0; i < 10; i++) {
          axios.get(`${getBackendURL()}/datasets/${id}/images/train/${images[i]}`, {
            headers: {
              Authorization: getAuthHeader() // Encrypted by TLS
            },
            responseType: 'blob', // Fetch as binary
          })
            .then(res => setImageSrcList(imageSrcList => [...imageSrcList, URL.createObjectURL(res.data)]))
          // .catch 
        }
      })
  }, [id]);

  const getTrainedModels = () => {
    axios.get(`${getBackendURL()}/datasets/${id}/models`, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    })
      .then(res => { setTrainedModels(res.data); setTrainedModelsReady(true); })
      .catch((e) => { setTrainedModels([]); setTrainedModelsReady(true); })
  }

  // Get trained models
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        getTrainedModels();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh])
  useEffect(() => {
    getTrainedModels();
  }, [id, startTrainVisible, stopTrainVisible, deleteTrainVisible]);

  // Track generation progress
  useEffect(() => {
    let updateProgress = true;

    if (generateVisible && generateProgressRequestParam) {
      const interval = setInterval(() => {
        axios.get(`${getBackendURL()}/servers/${generateFormData.sshServer}/generate/${generateProgressRequestParam}/progress`, {
          headers: {
            Authorization: getAuthHeader() // Encrypted by TLS
          },
        }).then(res => {
          if (updateProgress) {
            const progress = Number(res.data);
            setGenerateProgress(progress);
            if (progress == 100) {
              updateProgress = false;
              setGenerateProgressRequestParam(null);
            }
          }
        })
      }, 1000);
      return () => {
        updateProgress = false;
        clearInterval(interval);
      }
    }
  }, [generateVisible, generateProgressRequestParam])

  // Trained models accordion
  const AccordionItems = () => {
    let accordionItems = [];
    for (let model of trainedModels) {
      const hyperparameters = Object.entries(model)
        .filter(([key]) => key.startsWith('hyperparameter:'))
        .map(([key, value]) => `${key.replace("hyperparameter:", "")}=${value}`)
        .join(", ");
      if (model.trainingDone == false) {
        accordionItems.push(
          <CAccordionItem key={model.sessionName} itemKey={model.sessionName}>
            <CAccordionHeader>{model.sessionName}<CBadge className="m-1" color="secondary">{model.trainingProgress}%</CBadge></CAccordionHeader>
            <CAccordionBody>
              Preprocessing: {model.preprocessing}
              <br />
              Model: {model.model}
              <br />
              Hyperparameters: {hyperparameters}
              <br />
              SSH server: {model.sshServer}
              <br />
              <CButton type="submit" color="primary" onClick={() => {
                setSelectedSession(model.sessionName);
                startLogs();
              }}>Logs</CButton>
              <CButton type="submit" color="primary" className="ms-2" onClick={() => {
                setSelectedSession(model.sessionName);
                setSelectedServer(model.sshServer);
                setStopTrainVisible(true);
              }}>Stop training</CButton>
            </CAccordionBody>
          </CAccordionItem>)
      } else {
        accordionItems.push(
          <CAccordionItem key={model.sessionName} itemKey={model.sessionName}>
            <CAccordionHeader>{model.sessionName} </CAccordionHeader>
            <CAccordionBody>
              Preprocessing: {model.preprocessing}
              <br />
              Model: {model.model}
              <br />
              Hyperparameters: {hyperparameters}
              <br />
              SSH server: {model.sshServer}
              <br />
              <CButton type="submit" color="primary" onClick={() => {
                setGenerateFormData({
                  ...generateFormData,
                  ["trainedModel"]: model.sessionName,
                  ["sshServer"]: model.sshServer,
                });
                openGenerateModal();
              }}>Generate image</CButton>
              <CButton type="submit" color="primary" className="ms-2">Details</CButton>
              <CButton type="submit" color="primary" className="ms-2" onClick={() => {
                setDeleteTrainSessionName(model.sessionName);
                setDeleteTrainVisible(true);
              }}>Delete</CButton>
            </CAccordionBody>
          </CAccordionItem>
        )
      }
    }
    return accordionItems
  }

  const ImagesTrain = () => {
    let images = []
    for (let imageSrc of imageSrcList) {
      images.push(<CCol className="p-1 position-relative" key={imageSrc}><CImage fluid src={imageSrc} /></CCol>)
    }
    return images;
  }

  const ImagesGenerate = () => {
    let images = [];
    for (let i in generatedImageSrcList) {
      if (generatedImageSrcList[i]) {
        images.push(<CCol className="p-1" key={i}><CImage className="w-100" fluid src={generatedImageSrcList[i]} /></CCol>)
      } else {
        images.push(<CCol className="position-relative p-1" key={i}>
          <CProgress className="w-100 h-100 ratio ratio-1x1 bg-transparent" value={generateProgress} />
          <CPlaceholder as="div" className="position-absolute w-100 h-100 top-0 left-0 p-1" color="dark"  animation="wave">
            <CPlaceholder className="w-100 h-100 rounded-2"></CPlaceholder>
          </CPlaceholder>
        </CCol>)
      }
    }
    return images;
  }

  // Train Modal
  const [trainFormData, setTrainFormData] = useState({
    "preprocessing": "1",
    "model": "1",
    "hyperparameter:learningRate": "1e-10",
    "hyperparameter:maxSteps": "100",
    "sessionName": "",
    "sshServer": "",
  });

  const handleTrainChange = (e) => {
    setTrainFormData({
      ...trainFormData,
      [e.target.id]: e.target.value,
    });
  };

  const handleTrainSubmit = async (e) => {
    storeLocal('last-train-server', trainFormData.sshServer);
    axios.post(`${getBackendURL()}/servers/${trainFormData.sshServer}/train/${id}`, trainFormData, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    }).then(res => { setStartTrainVisible(false) });
  }

  const deleteTraining = async (sessionName) => {
    axios.delete(`${getBackendURL()}/datasets/${id}/models/${sessionName}`, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    }).then(res => { setDeleteTrainVisible(false) });
  }

  // Generate Modal
  const [generateFormData, setGenerateFormData] = useState({
    "trainedModel": "",
    "numberImages": "4",
    "sshServer": "",
  });

  const openGenerateModal = () => {
    setGenerateProgress(0);
    setGenerateProgressRequestParam(null);
    setGeneratedImageSrcList([]);
    setGenerateVisible(true);
    setGenerateFormVisible(true);
  }

  const handleGenerateChange = (e) => {
    setGenerateFormData({
      ...generateFormData,
      [e.target.id]: e.target.value,
    });
  };

  const handleGenerateSubmit = async (e) => {
    setGenerateFormVisible(false);
    setGeneratedImageSrcList(new Array(Number(generateFormData.numberImages)).fill(null));
    const timestamp = Date.now();
    const body = { ...generateFormData };
    body['datasetId'] = id;
    axios.post(`${getBackendURL()}/servers/${generateFormData.sshServer}/generate/${timestamp}`, body, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      },
    }).then(res => {
      for (let i = 0; i < generateFormData.numberImages; i++) {
        axios.get(`${getBackendURL()}/servers/${generateFormData.sshServer}/generate/${timestamp}/image/${i}`, {
          headers: {
            Authorization: getAuthHeader() // Encrypted by TLS
          },
          responseType: 'blob', // Fetch as binary
        })
          .then(res => {
            setGeneratedImageSrcList((prev) => {
              prev[i] = URL.createObjectURL(res.data);
              return [...prev];
            });
          })
        // .catch
      }
    });
    setGenerateProgress(0);
    setGenerateProgressRequestParam(timestamp);
  }

  const startLogs = () => {
    axios.get(`${getBackendURL()}/datasets/${id}/models/${selectedSession}/logs`, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    }).then(res => { });
  }

  // Site not ready
  if (!siteReady) {
    return (<div className="pt-3 text-center">
      <CSpinner color="primary" variant="grow" />
    </div>)
  }

  return (
    <>
      <div className="w-100 flex-grow-1 d-flex flex-row gap-3" style={{ height: 0 }}>

        <div className="d-flex flex-column bg-body rounded-4 p-3" style={{ flex: 3, minWidth: "450px" }}>

          <h2>Dataset {metadata.name}</h2>
          <div>Author: {metadata.author}</div>

          <CContainer className="flex-grow-1 mt-2 overflow-y-scroll">
            <CRow xs={{ cols: 2 }}>
              <ImagesTrain />
            </CRow>
            <CButton type="submit" className="my-2 text-secondary">Load more images</CButton>
          </CContainer>

          <div className="mt-3 d-flex flex-row gap-3">
            <CButton type="submit" color="primary" action="#">Add new image</CButton>
            <CButton type="submit" color="primary" action="#">Take a photo</CButton>
          </div>
        </div>

        <div className="d-flex flex-column bg-body rounded-4 p-3" style={{ flex: 2, minWidth: "300px" }}>
          <h2>Trained models</h2>

          <div className="flex-grow-1 overflow-auto">
            <CAccordion activeItemKey={activeAccordionItem}>
              {trainedModelsReady ? <AccordionItems /> : <div className="pt-3 text-center">
                <CSpinner color="primary" variant="grow" />
              </div>}
            </CAccordion>
          </div>

          <div className="d-flex flex-row gap-3 justify-content-center">
            <CButton color="primary" size='lg' onClick={() => {
              setTrainFormData({
                ...trainFormData,
                ["sessionName"]: `model-${getDateTime()}`,
              });
              setStartTrainVisible(true);
            }}>Train new model</CButton>
            <CButton color="primary" size='lg' onClick={() => {
              openGenerateModal();
            }}>Generate image</CButton>
          </div>
        </div>
      </div>

      <StartTrainModal modalVisible={startTrainVisible} setModalVisible={setStartTrainVisible} serverList={serverList} datasetId={id}/>

      <CModal
        scrollable
        visible={generateVisible}
        onClose={() => setGenerateVisible(false)}
        aria-labelledby="GenerateModal"
        size="lg"
      >
        <CModalHeader>
          <CModalTitle id="GenerateModal">Generate</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {generateFormVisible && <CForm>

            <CFormSelect
              id="trainedModel"
              floatingLabel="Trained model"
              options={trainedModels
                .filter(model => model.trainingDone)
                .map(model => ({
                  label: model.sessionName,
                  value: model.sessionName
                }))}
              value={generateFormData["trainedModel"]}
              onChange={handleGenerateChange}
            />
            <CFormInput className="mt-2"
              id="numberImages"
              type="text"
              floatingLabel="Number of images"
              value={generateFormData["numberImages"]}
              onChange={handleGenerateChange}
            />
            <CFormSelect className="mt-2"
              id="sshServer"
              floatingLabel="SSH server"
              options={serverList.map(server => ({
                label: server.name,
                value: server.id
              }))}
              value={generateFormData["sshServer"]}
              onChange={handleGenerateChange}
            />
          </CForm>}
          <CRow xs={{ cols: 2 }}>
            <ImagesGenerate />
          </CRow>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setGenerateVisible(false)}>Close</CButton>
          {/* <CButton color="primary">Download</CButton> */}
          <CButton color="primary" onClick={handleGenerateSubmit}>Generate</CButton>
        </CModalFooter>
      </CModal>

      <StopTrainModal modalVisible={stopTrainVisible} setModalVisible={setStopTrainVisible} sessionName={selectedSession} server={selectedServer}/>

      <CModal
        scrollable
        visible={deleteTrainVisible}
        onClose={() => setDeleteTrainVisible(false)}
        aria-labelledby="DeleteTrainModal"
      >
        <CModalHeader>
          <CModalTitle id="DeleteTrainModal">Delete training</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>Are you sure you want to delete training {deleteTrainSessionName}?</p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setDeleteTrainVisible(false)}>Cancel</CButton>
          <CButton color="primary" onClick={() => deleteTraining(deleteTrainSessionName)}>Delete training</CButton>
        </CModalFooter>
      </CModal>
    </>

  )
}

export default DatasetDashboard

