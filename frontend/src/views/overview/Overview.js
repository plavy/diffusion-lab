import { CAlert, CBadge, CButton, CCol, CListGroup, CListGroupItem, CRow, CSpinner } from "@coreui/react"
import NewServerModal from "../servers/NewServerModal"
import { useEffect, useState } from "react";
import { getAuthHeader, getBackendURL, getAuth, updateServerList, updateDatasetList, findName } from "../../utils";
import { cilCheck, cilWarning } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import NewDatasetModal from "../datasets/NewDatasetModal";

const Overview = () => {
  const dispatch = useDispatch();

  const [newServerModalVisible, setNewServerModalVisible] = useState(false);
  const [newDatasetModalVisible, setNewDatasetModalVisible] = useState(false);

  const [davStatus, setDavStatus] = useState(null);
  const updateDavStatus = () => {
    setDavStatus(null);
    axios.get(`${getBackendURL()}/models`, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    })
      .then((_) => setDavStatus(0))
      .catch((_) => setDavStatus(1));
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

  const autoRefresh = useSelector((state) => state.autoRefresh);
  const datasetList = useSelector((state) => state.datasetList);
  const serverList = useSelector((state) => state.serverList);

  useEffect(() => {
    updateDavStatus();
    updateDatasetList(dispatch);
    updateServerList(dispatch);
  }, []);

  const [serverStatus, setServerStatus] = useState({});
  useEffect(() => {
    for (const server of serverList) {
      axios.get(`${getBackendURL()}/servers/${server.id}/status`, {
        headers: {
          Authorization: getAuthHeader() // Encrypted by TLS
        }
      }).then((res) => setServerStatus(prev => ({ ...prev, [server.id]: res.data })))
        .catch((error) => setServerStatus(prev => ({ ...prev, [server.id]: error.response.data })));
    }
  }, [serverList]);

  const ServerStatus = ({ serverId }) => {
    return (
      <>
        {serverStatus[serverId] != null ? (serverStatus[serverId].code == 0 ? <CIcon className="text-success" icon={cilCheck} />
          : <CIcon className="text-danger" icon={cilWarning} />) : <CSpinner className="text-info" size="sm" />}
      </>
    )
  }

  const [sessions, setSessions] = useState({});
  const getAllSessions = async () => {
    for (const dataset of datasetList) {
      axios.get(`${getBackendURL()}/datasets/${dataset.id}/sessions`, {
        headers: {
          Authorization: getAuthHeader() // Encrypted by TLS
        }
      }).then((res) => res.data.map(session => setSessions(sessions => ({
        ...sessions,
        [`${dataset.id}-${session.sessionName}`]: session,
      }))));
    }
  }
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        getAllSessions();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, datasetList])
  useEffect(() => {
    getAllSessions();
  }, [datasetList])

  return (
    <>
      <NewServerModal modalVisible={newServerModalVisible} setModalVisible={setNewServerModalVisible} />
      <NewDatasetModal modalVisible={newDatasetModalVisible} setModalVisible={setNewDatasetModalVisible} />

      <div className="flex-grow-1 d-flex flex-column w-100" style={{ maxWidth: "900px", height: 0 }}>

        <div className="bg-body rounded-4 p-3">
          <h2>Status</h2>
          <DavStatus />
          <div>Number of datasets: {datasetList.length}</div>
          <CButton className="mt-3" color="primary" onClick={() => setNewDatasetModalVisible(true)}>Add new dataset</CButton>
        </div>

        <div className="flex-grow-1 d-flex flex-row flex-wrap gap-3 mt-3" style={{ height: 0 }}>

          <div className="d-flex flex-column bg-body rounded-4 p-3" style={{ flex: 1, minWidth: "300px" }}>
            <h2>Servers</h2>
            <CListGroup className="flex-grow-1 overflow-auto">
              {serverList.map(server =>
                <CListGroupItem key={server.id} as="a" href={`/#/servers/${server.id}`}>
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
            <div className="flex-grow-1 overflow-auto">
              {Object.values(sessions).length > 0 ?
                (
                  <CListGroup>
                    {Object.values(sessions).
                      filter(session => !session.error && !session.uploadDone && session.trainingProgress != "100")
                      .map(session => (
                        <CListGroupItem key={session.sessionName} as="a" href={`/#/datasets/${session.dataset}`}>
                          <h6 className="mb-1">{session.sessionName}
                            <CBadge className="m-1" color="secondary">{session.trainingProgress}%</CBadge></h6>
                          <small>{findName(datasetList, session.dataset)}</small>
                        </CListGroupItem>
                      ))}
                  </CListGroup>
                ) :
                (<div className="pt-3 text-center"><CSpinner color="primary" variant="grow" /></div>)}
            </div>
          </div>
        </div>

      </div>
    </>
  )
}

export default Overview;
