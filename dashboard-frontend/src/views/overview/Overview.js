import { CAlert, CButton, CCol, CListGroup, CListGroupItem, CRow, CSpinner } from "@coreui/react"
import NewServerModal from "../servers/NewServerModal"
import { useEffect, useState } from "react";
import { getAuthHeader, getBackendURL, getAuth } from "../../utils";
import { cilCheck, cilWarning } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import axios from "axios";

const Overview = () => {
    const [newServerModalVisible, setNewServerModalVisible] = useState(false);

    const [davStatus, setDavStatus] = useState(null);
    useEffect(() => {
        setDavStatus(null);
        axios.get(`${getBackendURL()}/servers`, {
            headers: {
                Authorization: getAuthHeader() // Encrypted by TLS
            }
        })
            .then((res) => setDavStatus(0))
            .catch((res) => setDavStatus(1));
    }, []);

    const domain = getAuth().url;
    const DavStatusChecking = () => (
        <div className="text-info">
            <CSpinner size="sm" /> Checking connection to {domain}...
        </div>
    )
    const DavStatusSuccess = () => (
        <div className="text-success">
            <CIcon icon={cilCheck} /> Connected to {domain}
        </div>
    )
    const DavStatusFail = () => (
        <div className="text-danger">
            <CIcon icon={cilWarning} /> Unable to connect to {domain}
        </div>
    )

    return (
        <>
            <NewServerModal modalVisible={newServerModalVisible} setModalVisible={setNewServerModalVisible}></NewServerModal>

            <div className="w-100" style={{ maxWidth: "900px" }}>

                <CRow>
                    <CCol className="bg-body rounded-4 p-3">
                        <h2>Status</h2>
                        {davStatus != null ? (davStatus == 0 ? <DavStatusSuccess /> : <DavStatusFail />) : <DavStatusChecking />}
                        <div>2 datasets</div>
                        <CButton color="primary mt-3">Add new dataset</CButton>
                    </CCol>
                </CRow>
                <CRow className="gap-3 mt-3">
                    <CCol className="bg-body rounded-4 p-3">
                        <h2>Servers</h2>
                        <CListGroup>
                            <CListGroupItem>
                                <div className="d-flex w-100 justify-content-between">
                                    <h5 className="mb-1">Napoleon VII</h5>
                                </div>
                                <small>napoleon.plavy.me</small>
                            </CListGroupItem>
                            <CListGroupItem>
                                <div className="d-flex w-100 justify-content-between">
                                    <h5 className="mb-1">Supek</h5>
                                </div>
                                <small>login-cpu...hr</small>
                            </CListGroupItem>
                        </CListGroup>
                        <CButton className="mt-3" color="primary" onClick={() => setNewServerModalVisible(true)}>Add new server</CButton>
                    </CCol>
                    <CCol className="bg-body rounded-4 p-3">
                        <h2>Trainings in progress</h2>
                        <CListGroup>
                            <CListGroupItem>
                                <div className="d-flex w-100 justify-content-between">
                                    <h5 className="mb-1">model-2</h5>
                                </div>
                            </CListGroupItem>
                        </CListGroup>
                    </CCol>
                </CRow>

            </div>
        </>
    )
}

export default Overview;
