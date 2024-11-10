import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import classNames from 'classnames';
import axios from "axios";
import { getAuthHeader } from "../../utils";

import {
  CCard,
  CCardImage,
  CCardGroup,
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
  CBadge
} from "@coreui/react";


const DatasetDashboard = () => {

  const { id } = useParams();

  const [metadata, setMetadata] = useState("");
  useEffect(() => {
    axios.get("http://localhost:8000/datasets/" + id, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    }).then((res) => setMetadata(res.data));
  }, [id]);

  const [trainVisible, setTrainVisible] = useState(false);


  return (
    <div className="d-flex flex-column h-100">
      <div className="row flex-grow-1">

        <div className="col">

          <h1>{metadata.name}</h1>
          <div>ID: {metadata.id}</div>
          <div>Author: {metadata.author}</div>

          <CCardGroup>
            <CCard>
              <CCardImage src="/src/assets/images/angular.jpg" />
            </CCard>

            <CCard>
              <CCardImage src="/src/assets/images/react.jpg" />
            </CCard>

            <CCard>
              <CCardImage src="/src/assets/images/vue.jpg" />
            </CCard>
          </CCardGroup>

          <CButton type="submit" color="primary" action="#">Add new image</CButton>
          <CButton type="submit" color="primary" action="#">Take a photo</CButton>

        </div>


        <div className="col-5 d-flex flex-column">
          <h2>Trained models</h2>

          <div style={{ flexGrow: 1 }}>

            <div className="overflow-auto" style={{ height: '500px' }}>

              <CAccordion>
                <CAccordionItem>
                  <CAccordionHeader>Latent diffusion 2024-11-10-08-23-35<CBadge className="m-1" color="secondary">30%</CBadge></CAccordionHeader>
                  <CAccordionBody>
                    Parameters: Epochs=30, Learning rate 100
                    <br />
                    <CButton type="submit" color="primary">Logs</CButton>
                    <CButton type="submit" color="primary" className="m-2">Stop training</CButton>
                  </CAccordionBody>
                </CAccordionItem>
                <CAccordionItem>
                  <CAccordionHeader>Latent diffusion <br />2024-11-10</CAccordionHeader>
                  <CAccordionBody>
                    Parameters: Epochs=30, Learning rate 100
                    <br />
                    <CButton type="submit" color="primary">Generate image</CButton>
                  </CAccordionBody>
                </CAccordionItem>
                <CAccordionItem>
                  <CAccordionHeader>Latent diffusion <br />2024-11-10</CAccordionHeader>
                  <CAccordionBody>
                    Parameters: Epochs=30, Learning rate 100
                    <br />
                    <CButton type="submit" color="primary">Generate image</CButton>
                  </CAccordionBody>
                </CAccordionItem>
                <CAccordionItem>
                  <CAccordionHeader>Latent diffusion <br />2024-11-10</CAccordionHeader>
                  <CAccordionBody>
                    Parameters: Epochs=30, Learning rate 100
                    <br />
                    <CButton type="submit" color="primary">Generate image</CButton>
                  </CAccordionBody>
                </CAccordionItem>
                <CAccordionItem>
                  <CAccordionHeader>Latent diffusion <br />2024-11-10</CAccordionHeader>
                  <CAccordionBody>
                    Parameters: Epochs=30, Learning rate 100
                    <br />
                    <CButton type="submit" color="primary">Generate image</CButton>
                  </CAccordionBody>
                </CAccordionItem>
                <CAccordionItem>
                  <CAccordionHeader>Latent diffusion <br />2024-11-10</CAccordionHeader>
                  <CAccordionBody>
                    Parameters: Epochs=30, Learning rate 100
                    <br />
                    <CButton type="submit" color="primary">Generate image</CButton>
                  </CAccordionBody>
                </CAccordionItem>
                <CAccordionItem>
                  <CAccordionHeader>Latent diffusion <br />2024-11-10</CAccordionHeader>
                  <CAccordionBody>
                    Parameters: Epochs=30, Learning rate 100
                    <br />
                    <CButton type="submit" color="primary">Generate image</CButton>
                  </CAccordionBody>
                </CAccordionItem>
                <CAccordionItem>
                  <CAccordionHeader>Latent diffusion <br />2024-11-10</CAccordionHeader>
                  <CAccordionBody>
                    Parameters: Epochs=30, Learning rate 100
                    <br />
                    <CButton type="submit" color="primary">Generate image</CButton>
                  </CAccordionBody>
                </CAccordionItem>
              </CAccordion>
            </div>
          </div>

          <div className="row m-3">
            <div className="col d-grid">
              <CButton color="primary" size='lg' onClick={() => setTrainVisible(true)}>Train new model</CButton>
            </div>
            <div className="col d-grid">
              <CButton type="submit" color="primary" size='lg' action="#">Generate image</CButton>
            </div>
          </div>
        </div>
      </div>

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
          <p></p>
          <CForm>

            <CFormSelect className="mt-2"
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
              id="filename"
              type="text"
              floatingLabel="Filename"
              value="model-timestamp"
            />

          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setTrainVisible(false)}>Cancel</CButton>
          <CButton color="primary">Start training</CButton>
        </CModalFooter>
      </CModal>

    </div>

  )
}

export default DatasetDashboard

