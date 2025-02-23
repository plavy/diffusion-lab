import { CAlert, CButton, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from "@coreui/react"
import axios from "axios";
import { getAuthHeader, getBackendURL } from "../../utils";
import { useEffect, useState } from "react";
import { useFetcher, useNavigate } from "react-router-dom";
import LoadingButton from "../../components/LoadingButton";
import CIcon from "@coreui/icons-react";
import { cilCheck, cilWarning } from "@coreui/icons";


const NewDatasetModal = ({ modalVisible, setModalVisible, inputFiles, setInputFiles }) => {
  const [watingResponse, setWaitingRespone] = useState(false);
  const [errorMesage, setErrorMessage] = useState("");
  let files, setFiles = [[], null];
  if (inputFiles) {
    [files, setFiles] = [inputFiles, setInputFiles];
  } else {
    [files, setFiles] = useState([]);
  }

  const getFilePath = (file) => {
    console.log(file.webkitRelativePath || file.relativePath.replace(/^\/+/, ''))
    return file.webkitRelativePath || file.relativePath.replace(/^\/+/, '');
  }

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files));
  };

  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    setWaitingRespone(true);

    if (files.length == 0) return alert("Please select a folder");

    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file, getFilePath(file).replace(/\//g, "$"));
    }
    axios.post(`${getBackendURL()}/datasets`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    })
      .then(res => {
        setModalVisible(false);
        navigate(`/datasets/${res.data.id}`);
      })
      .catch(error => {
        setErrorMessage(error.response.data);
        setWaitingRespone(false);
      });
  };

  const [metadataCheck, setMetadataCheck] = useState(null);
  const [dataCheck, setDataCheck] = useState(null);
  const check = () => {
    if (files.length == 0) {
      setMetadataCheck(null);
      setDataCheck(null);
    } else {
      setMetadataCheck(files.some(file => getFilePath(file).split('/')[1] == 'metadata.json'));
      setDataCheck(files.some(file => getFilePath(file).split('/')[1] == 'data'));
    }
  }

  useEffect(() => {
    if (modalVisible) {
    } else {
      setWaitingRespone(false);
      setErrorMessage("");
      setFiles([]);
    }
  }, [modalVisible]);

  useEffect(() => {
    check();
  }, [files])


  return (

    <CModal
      scrollable
      visible={modalVisible}
      aria-hidden={false}
      onClose={() => setModalVisible(false)}
    >
      <CModalHeader>
        <CModalTitle id="NewServerModal">New dataset</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {errorMesage ? <CAlert color="danger" ><CIcon className="me-1" icon={cilWarning} />{errorMesage}</CAlert> : null}
        <div>
          Upload one directory that contains:
          <div> - metadata.json file {metadataCheck != null ? (metadataCheck == true ? <CIcon icon={cilCheck} /> : <CIcon icon={cilWarning} />) : null}</div>
          <div> - data directory with images {dataCheck != null ? (dataCheck == true ? <CIcon icon={cilCheck} /> : <CIcon icon={cilWarning} />) : null}</div>
        </div>
        {inputFiles ? null :
          <input className="mt-2" type="file" webkitdirectory="true" mozdirectory="true" directory="true" onChange={handleFileChange} />
        }
        <div className="w-100 text-center mt-2">
          After adding the dataset, synchronize the environment of SSH server you want to use.
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={() => setModalVisible(false)}>Cancel</CButton>
        <LoadingButton color="primary" type="submit" loadingVisible={watingResponse} disabled={files.length == 0 || !metadataCheck || !dataCheck} onClick={handleSubmit}>
          Add new dataset
        </LoadingButton>
      </CModalFooter>
    </CModal>
  )
}

export default NewDatasetModal;