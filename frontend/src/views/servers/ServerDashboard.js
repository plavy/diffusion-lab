import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { getAuthHeader, getBackendURL, getLocal, updateServerList } from "../../utils";
import { CAlert, CButton, CContainer, CForm, CFormInput, CSpinner } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilCheck, cilWarning } from "@coreui/icons";
import { useDispatch } from "react-redux";
import LoadingButton from "../../components/LoadingButton";

const ServerDashboard = () => {
  const dispatch = useDispatch();

  const { id } = useParams();

  const [siteReady, setSiteReady] = useState(false);
  useEffect(() => {
    setSiteReady(false);
  }, [id]);

  const [metadata, setMetadata] = useState("");
  useEffect(() => {
    const getMetadata = (controller) => {
      axios.get(`${getBackendURL()}/servers/` + id, {
        signal: controller.signal,
        headers: {
          Authorization: getAuthHeader() // Encrypted by TLS
        }
      })
        .then((res) => { setMetadata(res.data); setSiteReady(true) })
        .catch((error) => {
          if (error.code != 'ERR_CANCELED') {
            navigate('/404')
          }
        }
        );
    }

    const controller = new AbortController();
    try {
      const filtered = getLocal('servers').filter(server => server.id == id);
      if (filtered.length == 1) {
        setMetadata(filtered[0]);
        setUpdateLoading(false);
        setSyncingLoading(false);
        setSiteReady(true);
        getMetadata(controller);
      } else {
        throw new Error();
      }
    } catch {
      getMetadata(controller);
    }
    return () => {
      controller.abort();
    }
  }, [id]);

  const [status, setStatus] = useState(null);
  useEffect(() => {
    updateServerList(dispatch);
    setStatus("");
    const controller = new AbortController();
    axios.get(`${getBackendURL()}/servers/${id}/status`, {
      signal: controller.signal,
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    }).then((res) => setStatus(res.data))
      .catch((error) => {
        if (error.code != 'ERR_CANCELED') {
          setStatus(error.response.data)
        }
      });
    return () => {
      controller.abort();
    }
  }, [id]);


  const Status = () => (
    status ?
      (status.code == 0 ?
        <CAlert id="statusSuccess" color="success">
          <CIcon icon={cilCheck} /> {status.message}
        </CAlert> :
        <CAlert id="statusFail" color="danger">
          <CIcon icon={cilWarning} /> {status.message}.
          Make sure that the public key of Diffusion Lab is added to SSH known hosts:
          <div className="bg-body-secondary rounded p-2 text-body">
            <div className="text-break">{status.publicKey}</div>
          </div>
        </CAlert>
      ) :
      <CAlert id="statusChecking" color="info">
        <CSpinner size="sm" /> Checking server status...
      </CAlert>
  )

  const handleChange = (e) => {
    setMetadata({
      ...metadata,
      [e.target.id]: e.target.value,
    });
  };

  const [updateLoading, setUpdateLoading] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    axios.put(`${getBackendURL()}/servers/${id}`, metadata, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    })
      .then(_ => { window.location.reload(); setUpdateLoading(false) });
  };

  const [syncingLoading, setSyncingLoading] = useState(false);
  const syncScripts = async () => {
    setSyncingLoading(true);
    await axios.post(`${getBackendURL()}/servers/${id}/sync`, null, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    }).then((res) => {
      setSyncingLoading(false);
      setStatus({
        code: 0,
        message: "Server synced"
      })
    }).catch((_) => {
      setSyncingLoading(false);
      setStatus({
        code: 1,
        message: "Sync failed"
      })
    });
  };

  const [clearingCacheVisible, setClearingCacheVisible] = useState(false);
  const [clearingCacheSuccessVisible, setClearingCacheSuccessVisible] = useState(false);
  const clearCache = async () => {
    setClearingCacheVisible(false);
    setClearingCacheSuccessVisible(true);
    await axios.delete(`${getBackendURL()}/servers/${id}/cache`, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    }).then((_) => {
      setClearingCacheVisible(false);
      setClearingCacheSuccessVisible(true);
    });
  };

  const navigate = useNavigate();
  const [removeLoading, setRemoveLoading] = useState(false);
  const removeServer = async () => {
    setRemoveLoading(true);
    await axios.delete(`${getBackendURL()}/servers/${id}`, {
      headers: {
        Authorization: getAuthHeader() // Encrypted by TLS
      }
    });
    navigate('/');
  }

  if (!siteReady) {
    return (<div className="pt-3 text-center">
      <CSpinner color="primary" variant="grow" />
    </div>)
  }

  return (
    <div className="w-100 flex-grow-1 d-flex flex-row flex-wrap flex-md-nowrap gap-3 justify-content-center align-items-center overflow-auto" style={{ maxWidth: "900px" }}>

      <div className="d-flex flex-column overflow-auto" style={{ flex: 3, minWidth: '300px' }}>

        <h1>{metadata.name}</h1>

        <Status />

        <CForm onSubmit={handleSubmit}>
          <CFormInput className="mb-3"
            type="text"
            id="name"
            floatingLabel="Display name"
            value={metadata.name}
            onChange={handleChange}
          ></CFormInput>
          <CFormInput className="mb-3"
            type="text"
            id="hostname"
            floatingLabel="Hostname"
            value={metadata.hostname}
            onChange={handleChange}
          />
          <CFormInput className="mb-3"
            type="text"
            id="port"
            floatingLabel="Port"
            value={metadata.port}
            onChange={handleChange}
          />
          <CFormInput className="mb-3"
            type="text"
            id="username"
            floatingLabel="Username"
            value={metadata.username}
            onChange={handleChange}
          />
          <CFormInput className="mb-3"
            type="text"
            id="icon"
            floatingLabel="Icon"
            value={metadata.icon}
            onChange={handleChange}
          />
          <LoadingButton color="primary" type="submit" loadingVisible={updateLoading}>
            Update configuration
          </LoadingButton>
        </CForm>

      </div>
      <div className="d-flex flex-column overflow-auto" style={{ flex: 2, minWidth: '300px' }}>

        <h2>Maintenance control</h2>
        <CContainer className="bg-body rounded-4 p-3">
          <div>Syncing will update Diffusion Lab datasets, training scripts and models on the SSH server. Python environment will also be updated.</div>
          <LoadingButton className="mt-2" type="submit" color="primary" loadingVisible={syncingLoading} onClick={() => syncScripts()}>
            Sync environment
          </LoadingButton>
        </CContainer>
        <CContainer className="bg-body rounded-4 p-3 mt-3">
          <div>Clearing cache will remove datasets, trained models, and generated images from the SSH server. Storage server is not affected.</div>
          <CButton className="mt-2" type="submit" color="primary" disabled={clearingCacheVisible} onClick={() => clearCache()}>
            <CSpinner size="sm" className="me-1" hidden={!clearingCacheVisible} />
            <CIcon icon={cilCheck} className="me-1" hidden={!clearingCacheSuccessVisible} />
            Clear cache
          </CButton>
        </CContainer>
        <CContainer className="bg-body rounded-4 p-3 mt-3">
          <div>Uninstalling will remove all Diffusion Lab files from the SSH server. The SSH server will also be removed from the dashboard. Storage server is not affected.</div>
          <LoadingButton className="mt-2" loadingVisible={removeLoading} type="submit" color="primary" onClick={() => removeServer()}>
            Uninstall environment
          </LoadingButton>
        </CContainer>
      </div>
    </div>
  )
}

export default ServerDashboard

