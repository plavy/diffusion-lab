import React, { useState } from "react";
import { CForm, CFormInput, CButton } from '@coreui/react'
import { getNextcloudSettings } from "../../utils";

const Settings = () => {

    const [formData, setFormData] = useState({
        "nextcloud-domain": getNextcloudSettings("nextcloud-domain"),
        "nextcloud-username": getNextcloudSettings("nextcloud-username"),
        "nextcloud-password": getNextcloudSettings("nextcloud-password"),
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        localStorage.setItem('nextcloud-settings', JSON.stringify(formData));
    };

    return (
        <>
            <h1>Settings</h1>
            <CForm onSubmit={handleSubmit}>
                <CFormInput className="mb-3"
                    type="text"
                    id="nextcloud-domain"
                    label="Nextcloud domain"
                    placeholder="nextcloud.example.com"
                    value={formData["nextcloud-domain"]}
                    onChange={handleChange}
                ></CFormInput>
                <CFormInput className="mb-3"
                    type="text"
                    id="nextcloud-username"
                    label="Nextcloud username"
                    placeholder="diffusion-lab"
                    value={formData["nextcloud-username"]}
                    onChange={handleChange}
                />
                <CFormInput className="mb-3"
                    type="password"
                    id="nextcloud-password"
                    label="Nextcloud password"
                    placeholder="************"
                    value={formData["nextcloud-password"]}
                    onChange={handleChange}
                />
                <CButton color="primary" type="submit" className="mb-3">
                    Save
                </CButton>
            </CForm>
        </>
    )
}

export default Settings

