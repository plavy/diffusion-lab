import { CButton, CForm, CFormInput } from "@coreui/react";
import { useState } from "react";
import { getAuth, storeAuth } from "../../utils";
import {useNavigate} from 'react-router-dom'

const Login = () => {

    const [formData, setFormData] = useState({
        "url": getAuth() ? getAuth().url : "",
        "username": "",
        "password": "",
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        storeAuth(formData);
        window.location.reload();
    };

    return (
        <div className="w-100 bg-body rounded-4 p-3" style={{ maxWidth: "600px" }}>
            <h1>Login</h1>
            <CForm id="form" onSubmit={handleSubmit} >
                <CFormInput className="mb-3"
                    type="text"
                    id="url"
                    label="Storate Server URL (WebDAV)"
                    placeholder="nextcloud.com/remote.php/webdav"
                    value={formData["url"]}
                    onChange={handleChange}
                ></CFormInput>
                <CFormInput className="mb-3"
                    type="text"
                    id="username"
                    label="Username"
                    placeholder="diffusion-lab"
                    value={formData["username"]}
                    onChange={handleChange}
                />
                <CFormInput className="mb-3"
                    type="password"
                    id="password"
                    label="Password"
                    placeholder="************"
                    value={formData["password"]}
                    onChange={handleChange}
                />
                <CButton color="primary" type="submit">
                    Log in
                </CButton>
            </CForm>
        </div>
    )
}

export default Login;