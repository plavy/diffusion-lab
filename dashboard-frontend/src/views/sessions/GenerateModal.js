import { useEffect, useState } from "react";
import { getAuthHeader, getBackendURL, getDateTime, getLocal, storeLocal } from "../../utils";
import { CAlert, CButton, CCol, CForm, CFormInput, CFormSelect, CImage, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CPlaceholder, CProgress, CRow } from "@coreui/react";
import { cilWarning } from "@coreui/icons";
import LoadingButton from "../../components/LoadingButton";
import CIcon from "@coreui/icons-react";
import axios from "axios";

const GenerateModal = ({ modalVisible, setModalVisible, serverList, session, sessions, dataset }) => {
  const [watingResponse, setWaitingRespone] = useState(false);
  const [errorMesage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    "trainedModel": "",
    "numberImages": "4",
    "sshServer": "",
  });
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    if (modalVisible) {
      const newFormData = { ...formData };
      if (session) {
        newFormData["trainedModel"] = session.sessionName;
        newFormData["sshServer"] = session.sshServer;
      } else {
        if (sessions.length > 0) {
          newFormData["trainedModel"] = sessions[0].sessionName;
        }
        if (serverList.length > 0) {
          newFormData["sshServer"] = serverList[0].id;
        }
      }
      setFormData(newFormData);
      setProgress(0);
      setProgressRequestParam(null);
      setImageSrcList([]);
      setFormVisible(true);
    } else {
      setWaitingRespone(false);
      setErrorMessage("");
      setFormData({
        "trainedModel": "",
        "numberImages": "4",
        "sshServer": "",
      });
    }
  }, [modalVisible]);

  const [imageSrcList, setImageSrcList] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    setWaitingRespone(true);
    setFormVisible(false);
    setImageSrcList(new Array(Number(formData.numberImages)).fill(null));
    const timestamp = Date.now();
    const body = { ...formData };
    body['datasetId'] = dataset;
    axios.post(`${getBackendURL()}/servers/${formData.sshServer}/generate/${timestamp}`, body, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      },
    })
      .then(res => {
        for (let i = 0; i < formData.numberImages; i++) {
          axios.get(`${getBackendURL()}/servers/${formData.sshServer}/generate/${timestamp}/image/${i}`, {
            headers: {
              Authorization: getAuthHeader() // Encrypted by TLS
            },
            responseType: 'blob', // Fetch as binary
          })
            .then(res => {
              setImageSrcList((prev) => {
                prev[i] = URL.createObjectURL(res.data);
                return [...prev];
              });
            })
            .catch(error => {
              setErrorMessage(error.response.data)
              setWaitingRespone(false);
              setFormVisible(true);
              setImageSrcList([]);
            })
        }
      })
      .catch(error => {
        setErrorMessage(error.response.data);
        setWaitingRespone(false);
        setFormVisible(true);
        setImageSrcList([]);
      });
    setProgress(0);
    setProgressRequestParam(timestamp);
  }


  // Track generation progress
  const [progress, setProgress] = useState(0);
  const [progressRequestParam, setProgressRequestParam] = useState(null);
  useEffect(() => {
    let updateProgress = true;

    if (modalVisible && progressRequestParam) {
      const interval = setInterval(() => {
        axios.get(`${getBackendURL()}/servers/${formData.sshServer}/generate/${progressRequestParam}/progress`, {
          headers: {
            Authorization: getAuthHeader() // Encrypted by TLS
          },
        }).then(res => {
          if (updateProgress) {
            const progress = Number(res.data);
            setProgress(progress);
            if (progress == 100) {
              updateProgress = false;
              setProgressRequestParam(null);
            }
          }
        })
      }, 1000);
      return () => {
        updateProgress = false;
        clearInterval(interval);
      }
    }
  }, [modalVisible, progressRequestParam]);


  const ImagesGenerate = () => {
    let images = [];
    for (let i in imageSrcList) {
      if (imageSrcList[i]) {
        images.push(<CCol className="p-1" key={i}><CImage className="w-100" fluid src={imageSrcList[i]} /></CCol>)
      } else {
        images.push(<CCol className="position-relative p-1" key={i}>
          <CProgress className="w-100 h-100 ratio ratio-1x1 bg-transparent" value={progress} />
          <CPlaceholder as="div" className="position-absolute w-100 h-100 top-0 left-0 p-1" color="dark" animation="wave">
            <CPlaceholder className="w-100 h-100 rounded-2"></CPlaceholder>
          </CPlaceholder>
        </CCol>)
      }
    }
    return images;
  }

  return <CModal
    scrollable
    visible={modalVisible}
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
          id="trainedModel"
          floatingLabel="Trained model"
          options={sessions
            .filter(model => model.trainingDone)
            .map(model => ({
              label: model.sessionName,
              value: model.sessionName
            }))}
          value={formData["trainedModel"]}
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
      <LoadingButton loadingVisible={watingResponse} color="primary" onClick={handleSubmit}>Generate</LoadingButton>
    </CModalFooter>
  </CModal>

}

export default GenerateModal;