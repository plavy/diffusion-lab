import { CButton,CForm, CFormInput, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from "@coreui/react"
import axios from "axios";
import { getAuthHeader, getBackendURL } from "../../utils";


const NewServerModal = ({modalVisible, setModalVisible}) => {

    const handleChange = (e) => {
      };
    
      const handleSubmit = (e) => {
        e.preventDefault();
        axios.post(`${getBackendURL()}/servers`, document.getElementById('form').data, {
          headers: {
            Authorization: getAuthHeader() // Encrypted by TLS
          }
        })
        .then(res => { window.location.reload(); });
      };
    

    return (

        <CModal
            scrollable
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            aria-labelledby="NewServerModal"
        >
            <CModalHeader>
                <CModalTitle id="NewServerModal">Add new server</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CForm id="form" onSubmit={handleSubmit}>
                    <CFormInput className="mb-3"
                        type="text"
                        id="name"
                        floatingLabel="Display name"
                        placeholder=""
                        onChange={handleChange}
                    ></CFormInput>
                    <CFormInput className="mb-3"
                        type="text"
                        id="hostname"
                        floatingLabel="Hostname"
                        placeholder=""
                        onChange={handleChange}
                    />
                    <CFormInput className="mb-3"
                        type="text"
                        id="port"
                        floatingLabel="Port"
                        placeholder=""
                        onChange={handleChange}
                    />
                    <CFormInput className="mb-3"
                        type="text"
                        id="username"
                        floatingLabel="Username"
                        placeholder=""
                        onChange={handleChange}
                    />
                </CForm>

            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" onClick={() => setModalVisible(false)}>Cancel</CButton>
                <CButton color="primary" type="submit" onClick={handleSubmit}>Add new server</CButton>
            </CModalFooter>
        </CModal>
    )
}

export default NewServerModal