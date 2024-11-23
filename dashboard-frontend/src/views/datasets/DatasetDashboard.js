import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import classNames from 'classnames';
import axios from "axios";
import { getAuthHeader } from "../../utils";

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
  CSpinner
} from "@coreui/react";


const DatasetDashboard = () => {

  const { id } = useParams();

  const [siteReady, setSiteReady] = useState(false);
  useEffect(() => {
    setSiteReady(false)
  }, [id])

  const [metadata, setMetadata] = useState("");
  useEffect(() => {
    axios.get("http://localhost:8000/datasets/" + id, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    }).then((res) => { setMetadata(res.data); setSiteReady(true) });
  }, [id]);

  const [trainVisible, setTrainVisible] = useState(false);
  const [generateVisible, setGenerateVisible] = useState(false);
  const [stopTrainVisible, setStopTrainVisible] = useState(false);
  const [stopTrainSessionName, setStopTrainSessionName] = useState(null);

  const [trainedModels, setTrainedModels] = useState([]);

  const getTrainedModels = () => {
    axios.get(`http://localhost:8000/servers/napoleon/models/${id}`, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    }).then(res => setTrainedModels(res.data))
  }
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     getTrainedModels();
  //   }, 5000);
  //   return () => clearInterval(interval);
  // }, [])
  useEffect(() => {
    getTrainedModels();
  }, [id, trainVisible, stopTrainVisible])

  const AccordionItems = () => {
    let accordionItems = []
    for (let model of trainedModels) {
      if (model.done) {
        accordionItems.push(
          <CAccordionItem>
            <CAccordionHeader>{model.name}</CAccordionHeader>
            <CAccordionBody>
              Parameters: Epochs=30, Learning rate 100
              <br />
              <CButton type="submit" color="primary">Generate image</CButton>
            </CAccordionBody>
          </CAccordionItem>
        )
      } else {
        accordionItems.push(
          <CAccordionItem key={model.name}>
            <CAccordionHeader>{model.name}<CBadge className="m-1" color="secondary">{Math.round(model.step / model.max_steps * 100)}%</CBadge></CAccordionHeader>
            <CAccordionBody>
              Parameters: Epochs=30, Learning rate 100
              <br />
              <CButton type="submit" color="primary">Logs</CButton>
              <CButton type="submit" color="primary" className="m-2" onClick={() => {
                setStopTrainSessionName(model.name);
                setStopTrainVisible(true);
              }}>Stop training</CButton>
            </CAccordionBody>
          </CAccordionItem>)
      }
    }
    return accordionItems
  }

  const startTraining = async (e) => {
    const form = document.getElementById('trainConfig');
    axios.post(`http://localhost:8000/servers/napoleon/train/${id}`, {
      sessionName: document.getElementById('session-name').value
    }, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    }).then(res => { setTrainVisible(false) });
  }

  const stopTraining = async (sessionName) => {
    axios.delete(`http://localhost:8000/servers/napoleon/train/${sessionName}`, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    }).then(res => { setStopTrainVisible(false) });
  }

  if (!siteReady) {
    return (<div className="pt-3 text-center">
      <CSpinner color="primary" variant="grow" />
    </div>)
  }

  return (
    <div className="d-flex flex-column h-100">
      <CRow className="flex-grow-1 gap-3">

        <CCol className="bg-body rounded-4 p-3">

          <h2>Dataset {metadata.name}</h2>
          <div>Author: {metadata.author}</div>

          <CContainer className="overflow-auto mt-2" style={{ height: '500px' }}>
            <CRow xs={{ cols: 2 }}>
              <CCol><CImage fluid src="/src/assets/images/angular.jpg" /></CCol>
              <CCol><CImage fluid src="/src/assets/images/react.jpg" /></CCol>
              <CCol><CImage fluid src="/src/assets/images/vue.jpg" /></CCol>
              <CCol><CImage fluid src="/src/assets/images/angular.jpg" /></CCol>
              <CCol><CImage fluid src="/src/assets/images/react.jpg" /></CCol>

            </CRow>
            <CButton type="submit" className="my-2 text-secondary">Load more images</CButton>
          </CContainer>

          <CButton type="submit" color="primary" action="#" className="m-2">Add new dataset</CButton>
          <CButton type="submit" color="primary" action="#" className="m-2">Add new image</CButton>
          <CButton type="submit" color="primary" action="#">Take a photo</CButton>

        </CCol>


        <CCol xs={5} className="d-flex flex-column bg-body rounded-4 p-3">
          <h2>Trained models</h2>

          <div style={{ flexGrow: 1 }}>

            <div className="overflow-auto" style={{ height: '500px' }}>
              <CAccordion>
                <AccordionItems />
              </CAccordion>
            </div>
          </div>

          <div className="row m-3">
            <div className="col d-grid">
              <CButton color="primary" size='lg' onClick={() => setTrainVisible(true)}>Train new model</CButton>
            </div>
            <div className="col d-grid">
              <CButton color="primary" size='lg' onClick={() => setGenerateVisible(true)}>Generate image</CButton>
            </div>
          </div>
        </CCol>
      </CRow>

      <CModal
        scrollable
        visible={trainVisible}
        onClose={() => setTrainVisible(false)}
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
            />
            <CFormSelect className="mt-2"
              id="model"
              floatingLabel="Model"
              options={[
                { label: 'Pixel diffusion', value: '1' },
                { label: 'Latent diffusion', value: '2' },
              ]}
            />
            <CFormInput className="mt-2"
              id="learning-rate"
              type="text"
              floatingLabel="Learning rate"
              value="1e-10"
            />
            <CFormInput className="mt-2"
              id="max-steps"
              type="text"
              floatingLabel="Max steps"
              value="10000"
            />
            <CFormInput className="mt-2"
              id="session-name"
              type="text"
              floatingLabel="Session name"
              value="model-timestamp"
            />

          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setTrainVisible(false)}>Cancel</CButton>
          <CButton color="primary" type="submit" onClick={startTraining}>Start training</CButton>
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
          <CForm>

            <CFormSelect
              id="trained-model"
              floatingLabel="Trained model"
              options={[
                { label: 'Latent_diffusion_2024-11-10', value: '1' },
                { label: 'Two', value: '2' },
                { label: 'Three', value: '3' }
              ]}
            />
            <CFormInput className="mt-2"
              id="number"
              type="text"
              floatingLabel="Number of images"
              value="4"
            />

          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setGenerateVisible(false)}>Close</CButton>
          <CButton color="primary">Download</CButton>
          <CButton color="primary">Generate</CButton>
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

    </div>

  )
}

export default DatasetDashboard

