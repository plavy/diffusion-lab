import { CAlert, CButton, CCol, CListGroup, CListGroupItem, CRow, CSpinner } from "@coreui/react"
import NewServerModal from "../servers/NewServerModal"
import { useEffect, useState } from "react";
import { getAuthHeader, getBackendURL, getAuth, updateServerList, updateDatasetList } from "../../utils";
import { cilCheck, cilWarning } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";

const Overview = () => {
  const dispatch = useDispatch();

  const [newServerModalVisible, setNewServerModalVisible] = useState(false);

  const [davStatus, setDavStatus] = useState(null);
  const updateDavStatus = () => {
    setDavStatus(null);
    axios.get(`${getBackendURL()}/datasets`, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    })
      .then((res) => setDavStatus(0))
      .catch((res) => setDavStatus(1));
  }

  const domain = getAuth().url;
  const DavStatus = () => (
    davStatus != null ? (davStatus == 0 ?
      <div className="text-success">
        <CIcon icon={cilCheck} /> Connected to {domain}
      </div> :
      <div className="text-danger">
        <CIcon icon={cilWarning} /> Unable to connect to {domain}
      </div>)
      : <div className="text-info">
        <CSpinner size="sm" /> Checking connection to {domain}...
      </div>
  )

  const datasetList = useSelector((state) => state.datasetList);
  const serverList = useSelector((state) => state.serverList);

  useEffect(() => {
    updateDavStatus();
    updateDatasetList(dispatch);
    updateServerList(dispatch);
  }, []);

  const [serverStatus, setServerStatus] = useState({});
  // const [lastCall, setLastCall] = useState(0);
  useEffect(() => {
    // const now = new Date().getTime();
    // if (now - lastCall >= 10000) {
      // setLastCall(now);
      for (const server of serverList) {        
        axios.get(`${getBackendURL()}/servers/${server.id}/status`, {
          headers: {
            Authorization: getAuthHeader() // Encrypted by TLS
          }
        }).then((res) => {
          setServerStatus(prev => ({...prev, [server.id]: res.data}))});
      }
    // }
  }, [serverList]);

  const ServerStatus = ({ serverId }) => {
    return (
      <>
        {serverStatus[serverId] != null ? (serverStatus[serverId].code == 0 ? <CIcon className="text-success" icon={cilCheck} />
          : <CIcon className="text-danger" icon={cilWarning} />) : <CSpinner className="text-info" size="sm" />}
      </>
    )
  }

  return (
    <>
      <NewServerModal modalVisible={newServerModalVisible} setModalVisible={setNewServerModalVisible}></NewServerModal>

      <div className="flex-grow-1 d-flex flex-column w-100" style={{ maxWidth: "900px", height: 0 }}>

        <div className="bg-body rounded-4 p-3">
          <h2>Status</h2>
          <DavStatus />
          <div>{datasetList.length} datasets</div>
          <CButton color="primary mt-3">Add new dataset</CButton>
        </div>

        <div className="flex-grow-1 d-flex flex-row flex-wrap gap-3 mt-3" style={{ height: 0 }}>

          <div className="d-flex flex-column bg-body rounded-4 p-3" style={{ flex: 1, minWidth: "300px" }}>
            <h2>Servers</h2>
            <CListGroup className="flex-grow-1 overflow-auto">
              {serverList.map(server =>
                <CListGroupItem key={server.id} as="a" href={`/servers/${server.id}`}>
                  <div className="d-flex flex-row gap-1 align-items-center justify-content-between">
                    <h5 className="mb-1">{server.name}</h5>
                    <ServerStatus serverId={server.id} />
                  </div>
                  <small>{server.hostname}</small>
                </CListGroupItem>)}
            </CListGroup>
            <div>
              <CButton className="mt-3" color="primary" onClick={() => setNewServerModalVisible(true)}>Add new server</CButton>
            </div>
          </div>
          <div className="d-flex flex-column bg-body rounded-4 p-3" style={{ flex: 1, minWidth: "300px" }}>
            <h2>Trainings in progress</h2>
            <CListGroup className="flex-grow-1 overflow-auto">
              <CListGroupItem>
                <div className="d-flex w-100 justify-content-between">
                  <h5 className="mb-1">model-2</h5>
                </div>
                <small>Maps</small>
              </CListGroupItem>
            </CListGroup>
          </div>
        </div>

      </div>
    </>
  )
}

export default Overview;
