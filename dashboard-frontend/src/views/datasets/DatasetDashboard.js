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
  CBadge,
  CContainer,
  CRow,
  CCol,
  CImage,
  CSpinner,
} from "@coreui/react";
import StartTrainModal from "../sessions/StartTrainModal";
import StopTrainModal from "../sessions/StopTrainModal";
import DeleteTrainModal from "../sessions/DeleteTrainModal";
import LogsModal from "../sessions/LogsModal";
import GenerateModal from "../sessions/GenerateModal";


const DatasetDashboard = () => {
  const dispatch = useDispatch();

  const { id } = useParams();

  const [siteReady, setSiteReady] = useState(false);

  const [generateVisible, setGenerateVisible] = useState(false);
  const [startTrainVisible, setStartTrainVisible] = useState(false);
  const [stopTrainVisible, setStopTrainVisible] = useState(false);
  const [deleteTrainVisible, setDeleteTrainVisible] = useState(false);
  const [logsVisible, setLogsVisible] = useState(false);

  const [selectedSession, setSelectedSession] = useState(null);

  const [trainedModels, setTrainedModels] = useState([]);
  const [trainedModelsReady, setTrainedModelsReady] = useState(false);
  const [activeAccordionItem, setActiveAccordionItem] = useState(null);

  const [imageSrcList, setImageSrcList] = useState([]);

  const autoRefresh = useSelector((state) => state.autoRefresh)
  const serverList = useSelector((state) => state.serverList);

  useEffect(() => {
    const servers = getLocal('servers');
    if (servers) {
      dispatch({ type: 'set', serverList: servers });
    }
    axios.get(`${getBackendURL()}/servers`, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    })
      .then((res) => {
        dispatch({ type: 'set', serverList: res.data });
        storeLocal('servers', res.data);
      });
  }, []);

  useEffect(() => {
    setSiteReady(false);
    setTrainedModelsReady(false);
    setSelectedSession(null);
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

  // Dataset images
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

  const ImagesTrain = () => {
    let images = []
    for (let imageSrc of imageSrcList) {
      images.push(<CCol className="p-1 position-relative" key={imageSrc}><CImage fluid src={imageSrc} /></CCol>)
    }
    return images;
  }

  // Trained models
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
  }, [id, startTrainVisible, stopTrainVisible, deleteTrainVisible, logsVisible, activeAccordionItem]);

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
                setSelectedSession(model);
                setLogsVisible(true);
              }}>Logs</CButton>
              <CButton type="submit" color="primary" className="ms-2" onClick={() => {
                setSelectedSession(model);
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
                setSelectedSession(model);
                setGenerateVisible(true);
              }}>Generate image</CButton>
              <CButton type="submit" color="primary" className="ms-2">Details</CButton>
              <CButton type="submit" color="primary" className="ms-2" onClick={() => {
                setSelectedSession(model);
                setDeleteTrainVisible(true);
              }}>Delete</CButton>
            </CAccordionBody>
          </CAccordionItem>
        )
      }
    }
    return accordionItems
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
              setStartTrainVisible(true);
            }}>Train new model</CButton>
            <CButton color="primary" size='lg' onClick={() => {
              setGenerateVisible(true);
            }}>Generate image</CButton>
          </div>
        </div>
      </div>

      <StartTrainModal modalVisible={startTrainVisible} setModalVisible={setStartTrainVisible} serverList={serverList} dataset={id} />
      <StopTrainModal modalVisible={stopTrainVisible} setModalVisible={setStopTrainVisible} session={selectedSession} />
      <DeleteTrainModal modalVisible={deleteTrainVisible} setModalVisible={setDeleteTrainVisible} session={selectedSession} dataset={id} />
      <LogsModal modalVisible={logsVisible} setModalVisible={setLogsVisible} session={selectedSession} />

      <GenerateModal modalVisible={generateVisible} setModalVisible={setGenerateVisible} serverList={serverList} sessions={trainedModels} session={selectedSession} dataset={id} />

    </>
  )
}

export default DatasetDashboard

