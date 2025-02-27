import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { getAuthHeader, getBackendURL } from "../../utils";
import { CAlert, CButton, CCol, CForm, CFormInput, CFormSelect, CImage, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CRow } from "@coreui/react";
import { cilWarning } from "@coreui/icons";
import LoadingButton from "../../components/LoadingButton";
import CIcon from "@coreui/icons-react";
import axios from "axios";
import ProgressPlaceholder from "../../components/ProgressPlaceholder";

const GenerateModal = ({ modalVisible, setModalVisible, serverList, session, sessions, dataset }) => {
  const dispatch = useDispatch();
  const [watingResponse, setWaitingRespone] = useState(false);
  const [errorMesage, setErrorMessage] = useState("");
  const controller = useRef(new AbortController());

  const [formData, setFormData] = useState({
    "session": "",
    "numberImages": "",
    "sshServer": "",
  });
  const [formVisible, setFormVisible] = useState(false);
  const [imageSrcList, setImageSrcList] = useState([]);

  useEffect(() => {
    if (modalVisible) {
      controller.current = new AbortController();
      const newFormData = { ...formData };
      if (session) {
        newFormData.session = session.sessionName;
        newFormData.sshServer = session.sshServer;
      } else {
        if (sessions.length > 0) {
          newFormData.session = sessions[0].sessionName;
        }
        if (serverList.length > 0) {
          if (sessions.length > 0) {
            newFormData.sshServer = sessions[0].sshServer;
          } else {
            newFormData.sshServer = serverList[0].id;
          }
        }
      }
      setFormData(newFormData);
      setImageSrcList([]);
      setFormVisible(true);
    } else {
      controller.current.abort();
      setWaitingRespone(false);
      setErrorMessage("");
      setFormData({
        session: "",
        numberImages: "4",
        sshServer: "",
      });
      clearInterval(progressInterval.current);
      clearInterval(progressUpdateInterval.current);
      dispatch({ type: 'set', blockAutoRefresh: false });
    }
  }, [modalVisible]);


  // Generation progress
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef(null);
  const progressUpdateInterval = useRef(null);
  const latestProgress = useRef(0);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    const timestamp = Date.now();

    dispatch({ type: 'set', blockAutoRefresh: true });
    setWaitingRespone(true);
    setErrorMessage("");
    setFormVisible(false);

    // Progress setup
    setProgress(0);
    latestProgress.current = 0;
    progressUpdateInterval.current = setInterval(() => {
      setProgress(latestProgress.current); // Update progress every 2 seconds
      if (latestProgress.current == 100) {
        clearInterval(progressUpdateInterval.current);
      }
    }, 2000);
    progressInterval.current = setInterval(() => {
      axios.get(`${getBackendURL()}/servers/${formData.sshServer}/generate/${timestamp}/progress`, {
        signal: controller.current.signal,
        headers: {
          Authorization: getAuthHeader() // Encrypted by TLS
        },
      })
        .then(res => {
          const progress = Number(res.data)
          latestProgress.current = progress;
          if (progress == 100) {
            clearInterval(progressInterval.current);
          }
        })
        .catch((error) => {
          if (error.code != 'ERR_CANCELED') {
          }
        })
    }, 2000);

    setImageSrcList(new Array(Number(formData.numberImages)).fill(null));
    const body = { ...formData };
    body['datasetId'] = dataset;
    axios.post(`${getBackendURL()}/servers/${formData.sshServer}/generate/${timestamp}`, body, {
      signal: controller.current.signal,
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      },
    })
      .then(_ => {
        for (let i = 0; i < formData.numberImages; i++) {
          axios.get(`${getBackendURL()}/servers/${formData.sshServer}/generate/${timestamp}/image/${i}`, {
            signal: controller.current.signal,
            headers: {
              Authorization: getAuthHeader() // Encrypted by TLS
            },
            responseType: 'blob', // Fetch as binary
          })
            .then(res => {
              setWaitingRespone(false);
              setErrorMessage("");
              setImageSrcList((prev) => {
                prev[i] = URL.createObjectURL(res.data);
                return [...prev];
              });
              dispatch({ type: 'set', blockAutoRefresh: false });
            })
            .catch(error => {
              if (error.code != 'ERR_CANCELED') {
                setErrorMessage(String(error.response.data));
                setWaitingRespone(false);
                setFormVisible(true);
                setImageSrcList([]);
                clearInterval(progressInterval.current);
                clearInterval(progressUpdateInterval.current);
              }
            })
        }
      })
      .catch(error => {
        if (error.code != 'ERR_CANCELED') {
          setErrorMessage(error.response.data);
          setWaitingRespone(false);
          setFormVisible(true);
          setImageSrcList([]);
          clearInterval(progressInterval.current);
          clearInterval(progressUpdateInterval.current);
        }
      });
  }

  const ImagesGenerate = () => {
    let images = [];
    for (let i in imageSrcList) {
      if (imageSrcList[i]) {
        images.push(<CCol className="p-1" key={i}><CImage className="w-100" fluid src={imageSrcList[i]} /></CCol>)
      } else {
        images.push(<CCol className="p-1" key={i}>
          <ProgressPlaceholder progress={progress} />
        </CCol>)
      }
    }
    return images;
  }

  return <CModal
    scrollable
    visible={modalVisible}
    aria-hidden={false}
    onClose={() => setModalVisible(false)}
    size="lg"
  >
    <CModalHeader>
      <CModalTitle id="GenerateModal">Generate</CModalTitle>
    </CModalHeader>
    <CModalBody>
      {errorMesage ? <CAlert color="danger" ><CIcon className="me-1" icon={cilWarning} />{errorMesage}</CAlert> : null}
      {formVisible && <CForm>

        <CFormSelect
          id="session"
          floatingLabel="Session"
          options={sessions
            .map(session => ({
              label: session.sessionName,
              value: session.sessionName
            }))}
          value={formData["session"]}
          onChange={handleChange}
        />
        <CFormInput className="mt-2"
          id="numberImages"
          type="text"
          floatingLabel="Number of images"
          value={formData["numberImages"]}
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
      </CForm>}
      <CRow xs={{ cols: 2 }}>
        <ImagesGenerate />
      </CRow>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" onClick={() => setModalVisible(false)}>Close</CButton>
      <LoadingButton
        loadingVisible={watingResponse}
        color="primary"
        onClick={handleSubmit}
        style={{ background: 'linear-gradient(135deg, var(--cui-btn-bg) 40%, orange)' }}
      >Generate</LoadingButton>
    </CModalFooter>
  </CModal>

}

export default GenerateModal;
