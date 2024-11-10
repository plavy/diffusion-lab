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

  return (
    <div className="d-flex flex-column h-100">
      <div className="row flex-grow-1">

        <div className="col">

          <h1>{metadata.name}</h1>
          <div>ID: {metadata.id}</div>
          <div>Author: {metadata.author}</div>

          <CCardGroup>
            <CCard>
              <CCardImage src="src/assets/images/angular.jpg" />
            </CCard>

            <CCard>
              <CCardImage src="src/assets/images/react.jpg" />
            </CCard>

            <CCard>
              <CCardImage src="src/assets/images/vue.jpg" />
            </CCard>
          </CCardGroup>

          <CButton type="submit" color="primary" action="#">Add new image</CButton>
          <CButton type="submit" color="primary" action="#">Take a photo</CButton>

        </div>


        <div className="col-5 d-flex flex-column">
          <h2>Models</h2>

          <div style={{ flexGrow: 1 }}>

            <div className="overflow-auto" style={{ height: '500px' }}>

              <CAccordion>
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
              <CButton type="submit" color="primary" size='lg' action="#">Train new model</CButton>
            </div>
            <div className="col d-grid">
              <CButton type="submit" color="primary" size='lg' action="#">Generate image</CButton>
            </div>
          </div>
        </div>
      </div>
    </div>

  )
}

export default DatasetDashboard

