import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import classNames from 'classnames';
import axios from "axios";
import { getAuthHeader, getBackendURL, getDateTime, getLocal, storeLocal } from "../../utils";

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


const DatasetDashboard = () => {

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

  const [trainedModels, setTrainedModels] = useState([]);
  const [trainedModelsReady, setTrainedModelsReady] = useState(false);
  const [activeAccordionItem, setActiveAccordionItem] = useState(null);

  const [imageSrcList, setImageSrcList] = useState([]);
  const [generatedImageSrcList, setGeneratedImageSrcList] = useState([]);

  const [serverList, setServerList] = useState([]);
  const setStartSSHServer = (servers) => {
    if (servers.length > 0) {
      const lastTrainServer = getLocal('last-train-server');
      if (lastTrainServer && servers.some(server => server.id === lastTrainServer)) {
        setTrainFormData({
          ...trainFormData,
          ["sessionName"]: `model-${getDateTime()}`,
          ["sshServer"]: lastTrainServer,
        });
      } else {
        setTrainFormData({
          ...trainFormData,
          ["sessionName"]: `model-${getDateTime()}`,
          ["sshServer"]: servers[0].id,
        });
      }
    }
  }
  useEffect(() => {
    const servers = getLocal('servers');
    if (servers) {
      setServerList(servers);
      setStartSSHServer(servers);
    }
    axios.get(`${getBackendURL()}/servers`, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    })
      .then((res) => {
        setServerList(res.data);
        storeLocal('servers', res.data);
        setStartSSHServer(res.data);
      });
  }, []);

  const [metadata, setMetadata] = useState("");
  useEffect(() => {
    axios.get(`${getBackendURL()}/datasets/${id}`, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    }).then((res) => { setMetadata(res.data); setSiteReady(true); });
  }, [id]);

  useEffect(() => {
    setSiteReady(false);
    setTrainedModelsReady(false);
  }, [id])

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
    if (getLocal("auto-refresh-enabled")) {
      const interval = setInterval(() => {
        getTrainedModels();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [])
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
      }, 500);
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
              <CButton type="submit" color="primary">Logs</CButton>
              <CButton type="submit" color="primary" className="ms-2" onClick={() => {
                setStopTrainSessionName(model.sessionName);
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
      images.push(<CCol className="p-1" key={imageSrc}><CImage fluid src={imageSrc} /></CCol>)
    }
    return images;
  }

  const ImagesGenerate = () => {
    let images = [];
    for (let i in generatedImageSrcList) {
      if (generatedImageSrcList[i]) {
        images.push(<CCol className="p-1" key={i}><CImage className="w-100" fluid src={generatedImageSrcList[i]} /></CCol>)
      } else {
        images.push(<CCol className="p-1" key={i}>
          <CProgress className="w-100 h-100 ratio ratio-1x1" variant="striped" animated value={generateProgress} />
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

  const stopTraining = async (sessionName) => {
    axios.delete(`http://localhost:8000/servers/${selectedServer}/train/${sessionName}`, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    }).then(res => { setStopTrainVisible(false) });
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

  // Site not ready
  if (!siteReady) {
    return (<div className="pt-3 text-center">
      <CSpinner color="primary" variant="grow" />
    </div>)
  }

  return (
    <>
      <div className="w-100 flex-grow-1 d-flex flex-row gap-3" style={{ height: 0 }}>

        <div className="d-flex flex-column bg-body rounded-4 p-3" style={{ flex: 3 }}>

          <h2>Dataset {metadata.name}</h2>
          <div>Author: {metadata.author}</div>

          <CContainer className="flex-grow-1 mt-2 overflow-y-scroll">
            <CRow xs={{ cols: 2 }}>
              <ImagesTrain />
            </CRow>
            <CButton type="submit" className="my-2 text-secondary">Load more images</CButton>
          </CContainer>

          <div className="row m-3">
            <div className="col d-grid">
              <CButton type="submit" color="primary" action="#">Add new image</CButton>
            </div>
            <div className="col d-grid">
              <CButton type="submit" color="primary" action="#">Take a photo</CButton>
            </div>
          </div>
        </div>

        <div className="d-flex flex-column bg-body rounded-4 p-3" style={{ flex: 2 }}>
          <h2>Trained models</h2>

          <div className="flex-grow-1 overflow-auto">
            <CAccordion activeItemKey={activeAccordionItem}>
              {trainedModelsReady ? <AccordionItems /> : <div className="pt-3 text-center">
                <CSpinner color="primary" variant="grow" />
              </div>}
            </CAccordion>
          </div>

          <div className="row m-3">
            <div className="col d-grid">
              <CButton color="primary" size='lg' onClick={() => {
                setTrainFormData({
                  ...trainFormData,
                  ["sessionName"]: `model-${getDateTime()}`,
                });
                setStartTrainVisible(true);
              }}>Train new model</CButton>
            </div>
            <div className="col d-grid">
              <CButton color="primary" size='lg' onClick={() => {
                openGenerateModal();
              }}>Generate image</CButton>
            </div>
          </div>
        </div>
      </div>

      <CModal
        scrollable
        visible={startTrainVisible}
        onClose={() => setStartTrainVisible(false)}
        aria-labelledby="TrainModal"
        size="lg"
      >
        <CModalHeader>
          <CModalTitle id="TrainModal">Train</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm id="trainConfig">
            <CFormSelect
              id="preprocessing"
              floatingLabel="Preprocessing"
              options={[
                { label: 'One', value: '1' },
                { label: 'Two', value: '2' },
                { label: 'Three', value: '3' }
              ]}
              onChange={handleTrainChange}
            />
            <CFormSelect className="mt-2"
              id="model"
              floatingLabel="Model"
              options={[
                { label: 'Pixel diffusion', value: '1' },
                { label: 'Latent diffusion', value: '2' },
              ]}
              onChange={handleTrainChange}
            />
            <CFormInput className="mt-2"
              id="hyperparameter:learningRate"
              type="text"
              floatingLabel="Learning rate"
              value={trainFormData["hyperparameter:learningRate"]}
              onChange={handleTrainChange}
            />
            <CFormInput className="mt-2"
              id="hyperparameter:maxSteps"
              type="text"
              floatingLabel="Max steps"
              value={trainFormData["hyperparameter:maxSteps"]}
              onChange={handleTrainChange}
            />
            <CFormInput className="mt-2"
              id="sessionName"
              type="text"
              floatingLabel="Session name"
              value={trainFormData["sessionName"]}
              onChange={handleTrainChange}
            />
            <CFormSelect className="mt-2"
              id="sshServer"
              floatingLabel="SSH server"
              options={serverList.map(server => ({
                label: server.name,
                value: server.id
              }))}
              value={trainFormData["sshServer"]}
              onChange={handleTrainChange}
            />

          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setStartTrainVisible(false)}>Cancel</CButton>
          <CButton color="primary" type="submit" onClick={handleTrainSubmit}>Start training</CButton>
        </CModalFooter>
      </CModal>


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

      <CModal
        scrollable
        visible={stopTrainVisible}
        onClose={() => setStopTrainVisible(false)}
        aria-labelledby="StopTrainModal"
      >
        <CModalHeader>
          <CModalTitle id="StopTrainModal">Stop training</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>Are you sure you want to stop training {stopTrainSessionName}?</p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setStopTrainVisible(false)}>Cancel</CButton>
          <CButton color="primary" onClick={() => stopTraining(stopTrainSessionName)}>Stop training</CButton>
        </CModalFooter>
      </CModal>

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

