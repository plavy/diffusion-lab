import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { findName, getAuthHeader, getBackendURL, getLocal, updateAugmentationList, updateDatasetList, updateDownsizingList, updateModelList, updateServerList } from "../../utils";
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
import DetailsModal from "../sessions/DetailsModal";
import ProgressPlaceholder from "../../components/ProgressPlaceholder";
import { cilCoffee } from "@coreui/icons";
import CIcon from "@coreui/icons-react";


const DatasetDashboard = () => {
  const dispatch = useDispatch();

  const { id } = useParams();

  const [siteReady, setSiteReady] = useState(false);

  const [generateVisible, setGenerateVisible] = useState(false);
  const [startTrainVisible, setStartTrainVisible] = useState(false);
  const [stopTrainVisible, setStopTrainVisible] = useState(false);
  const [deleteTrainVisible, setDeleteTrainVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [logsVisible, setLogsVisible] = useState(false);

  const [selectedSession, setSelectedSession] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [sessionsReady, setSessionsReady] = useState(false);
  const [activeAccordionItem, setActiveAccordionItem] = useState(null);

  const [numberImages, setNumberImages] = useState(null);
  const [numberImagesShown, setNumberImagesShown] = useState(10);
  const [imageSrcs, setImageSrcs] = useState({});

  const autoRefresh = useSelector((state) => state.autoRefresh);
  const blockAutoRefresh = useSelector((state) => state.blockAutoRefresh);
  const serverList = useSelector((state) => state.serverList);
  const downsizingList = useSelector((state) => state.downsizingList);
  const augmentationList = useSelector((state) => state.augmentationList);
  const modelList = useSelector((state) => state.modelList);

  useEffect(() => {
    updateDatasetList(dispatch);
    updateServerList(dispatch);
    updateDownsizingList(dispatch);
    updateAugmentationList(dispatch);
    updateModelList(dispatch);
    setSiteReady(false);
    setSessionsReady(false);
    setSelectedSession(null);
    setImageSrcs({});
    setNumberImages(null);
    setNumberImagesShown(10);
  }, [id]);

  // Metadata
  const navigate = useNavigate();
  const [metadata, setMetadata] = useState("");
  useEffect(() => {
    const getMetadata = (controller) => {
      axios.get(`${getBackendURL()}/datasets/${id}`, {
        signal: controller.signal,
        headers: {
          Authorization: getAuthHeader() // Encrypted by TLS
        }
      })
        .then((res) => { setMetadata(res.data); setSiteReady(true); })
        .catch((error) => {
          if (error.code != 'ERR_CANCELED') {
            navigate('/404');
          }
        });
    }

    const controller = new AbortController();
    try {
      const filtered = getLocal('datasets').filter(dataset => dataset.id == id);
      if (filtered.length == 1) {
        setMetadata(filtered[0]);
        setSiteReady(true);
        getMetadata(controller);
      } else {
        throw new Error();
      }
    } catch {
      getMetadata(controller);
    }
    return () => {
      controller.abort();
    }
  }, [id]);

  // Dataset images
  useEffect(() => {
    const controller = new AbortController();
    axios.get(`${getBackendURL()}/datasets/${id}/images`, {
      signal: controller.signal,
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    })
      .then(res => {
        const images = res.data;
        setNumberImages(images.length);
        for (let i = 0; i < numberImagesShown; i++) {
          axios.get(`${getBackendURL()}/datasets/${id}/images/${images[i]}`, {
            signal: controller.signal,
            headers: {
              Authorization: getAuthHeader() // Encrypted by TLS
            },
            responseType: 'blob', // Fetch as binary
          })
            .then(res => setImageSrcs(imageSrcs => ({ ...imageSrcs, [i]: URL.createObjectURL(res.data) })))
            .catch((error) => {
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
    return () => {
      controller.abort();
    }
  }, [id, numberImagesShown]);

  const ImagesTrain = () => {
    let images = []
    for (let i = 0; i < numberImagesShown; i++) {
      if (imageSrcs[i]) {
        images.push(<CCol className="text-center p-1" key={i}><CImage fluid src={imageSrcs[i]} /></CCol>)
      } else {
        images.push(<CCol className="text-center p-1" key={i}><ProgressPlaceholder progress={100} color_left="var(--cui-secondary)" color_right="var(--cui-body-bg)" /></CCol>)
      }
    }
    return images;
  }

  // Traning sessions
  const getSessions = (controller) => {
    axios.get(`${getBackendURL()}/datasets/${id}/sessions`, {
      signal: controller.signal,
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    })
      .then(res => { setSessions(res.data); setSessionsReady(true); })
      .catch((error) => {
        if (error.code != 'ERR_CANCELED') {
        }
      });
  }

  // Get traning sessions
  useEffect(() => {
    const controller = new AbortController();

    if (autoRefresh && !blockAutoRefresh) {
      const interval = setInterval(() => {
        getSessions(controller);
      }, 6000);
      return () => {
        clearInterval(interval);
        controller.abort();
      };
    }
  }, [autoRefresh, blockAutoRefresh, id])
  useEffect(() => {
    const controller = new AbortController();
    getSessions(controller);
    return () => {
      controller.abort();
    }
  }, [id, startTrainVisible, stopTrainVisible, deleteTrainVisible, logsVisible, detailsVisible, generateVisible, activeAccordionItem]);

  const AccordionItems = () => {
    let accordionItems = [];
    for (let session of sessions) {
      accordionItems.push(
        <CAccordionItem key={session.sessionName} itemKey={session.sessionName}>
          <CAccordionHeader>{session.sessionName}
            {
              session.error ?
                <CBadge className="m-1" color="danger">ERROR</CBadge> : (
                  session.uploadDone ? null : (
                    session.trainingProgress == "100" ? <CBadge className="m-1" color="primary">UPLOADING</CBadge> :
                      <CBadge className="m-1" color="secondary">{session.trainingProgress}%</CBadge>))
            }
          </CAccordionHeader>
          <CAccordionBody>
            {session.error ? session.error : (
              <>
                Model: {findName(modelList, session.model)}
                <br />
                Max steps: {session.hyperparameters['max-steps']}
                <br />
                SSH server: {findName(serverList, session.sshServer)}
              </>
            )}
            <div className="mt-1 d-flex flex-row flex-wrap gap-2">

              {
                !session.error && session.trainingProgress != "0" ?
                  <CButton type="submit" color="primary" onClick={() => {
                    setSelectedSession(session);
                    setGenerateVisible(true);
                  }}>Generate image
                  </CButton> : null
              }
              {!session.error ?
                <CButton type="submit" color="primary" onClick={() => {
                  setSelectedSession(session);
                  setDetailsVisible(true);
                }}>Details
                </CButton> : null
              }
              {
                !session.error && session.trainingProgress != "100" && session.uploadDone != true ?
                  <CButton type="submit" color="primary" onClick={() => {
                    setSelectedSession(session);
                    setLogsVisible(true);
                  }}>Logs
                  </CButton> : null
              }
              {
                !session.error && session.trainingProgress != "100" && session.uploadDone != true ?
                  <CButton type="submit" color="primary" onClick={() => {
                    setSelectedSession(session);
                    setStopTrainVisible(true);
                  }}>Stop
                  </CButton> : null
              }
              {session.error || session.uploadDone ?
                <CButton type="submit" color="primary" onClick={() => {
                  setSelectedSession(session);
                  setDeleteTrainVisible(true);
                }}>Delete
                </CButton> : null
              }
            </div>
          </CAccordionBody>
        </CAccordionItem>)
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
      <StartTrainModal modalVisible={startTrainVisible} setModalVisible={setStartTrainVisible} serverList={serverList} downsizingList={downsizingList} augmentationList={augmentationList} modelList={modelList} dataset={id} />
      <StopTrainModal modalVisible={stopTrainVisible} setModalVisible={setStopTrainVisible} session={selectedSession} />
      <DeleteTrainModal modalVisible={deleteTrainVisible} setModalVisible={setDeleteTrainVisible} session={selectedSession} dataset={id} />
      <DetailsModal modalVisible={detailsVisible} setModalVisible={setDetailsVisible} serverList={serverList} downsizingList={downsizingList} augmentationList={augmentationList} modelList={modelList} session={selectedSession} dataset={id} />
      <LogsModal modalVisible={logsVisible} setModalVisible={setLogsVisible} session={selectedSession} />
      <GenerateModal modalVisible={generateVisible} setModalVisible={setGenerateVisible} serverList={serverList} sessions={sessions} session={selectedSession} dataset={id} />

      <div className="w-100 flex-grow-1 d-flex flex-row flex-wrap flex-md-nowrap gap-3 overflow-auto">

        <div className="d-flex flex-column bg-body rounded-4 p-3" style={{ flex: 3, minWidth: "320px" }}>

          <h2>Dataset {metadata.name}</h2>
          <div>Number of images: {numberImages}</div>

          <CContainer className="flex-grow-1 mt-2 overflow-auto">
            <CRow xs={{ cols: 2 }}>
              <ImagesTrain />
            </CRow>
            <CButton type="submit" className="my-2 text-secondary" onClick={() => {
              if (numberImages != null) {
                const newNumber = Math.min(numberImagesShown + 10, numberImages);
                setNumberImagesShown(newNumber);
              }
            }}
            >Load more images</CButton>
          </CContainer>
        </div>

        <div className="d-flex flex-column bg-body rounded-4 p-3" style={{ flex: 2, minWidth: "320px" }}>
          <h2>Training sessions</h2>

          <div className="flex-grow-1 overflow-auto">
            <CAccordion>
              {sessionsReady ?
                sessions.length > 0 ?
                  <AccordionItems />
                  : <div div className="pt-3 text-center">
                    <CIcon icon={cilCoffee} size="3xl" />
                    <div>Waiting to start training</div>
                  </div>
                : <div className="pt-3 text-center">
                  <CSpinner color="primary" variant="grow" />
                </div>}
            </CAccordion>
          </div>

          <div className="d-flex flex-row flex-wrap gap-2 justify-content-center mt-3">
            <CButton
              size='lg'
              color="primary"
              disabled={!sessionsReady}
              onClick={() => {
                setStartTrainVisible(true);
              }}>Start new training</CButton>
            <CButton
              size='lg'
              color="primary"
              disabled={!sessionsReady}
              onClick={() => {
                setGenerateVisible(true);
              }}>Generate image</CButton>
          </div>
        </div>
      </div>
    </>
  )
}

export default DatasetDashboard

