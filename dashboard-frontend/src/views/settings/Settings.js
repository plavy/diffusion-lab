import React, { useState } from "react";
import { CForm, CFormInput, CButton } from '@coreui/react'

const Settings = () => {

    function getSettings(name) {
        try {
            return JSON.parse(localStorage.getItem('nextcloud-settings'))[name];
        } catch (e){
            return "";
        }
    }

    const [formData, setFormData] = useState({
        "nextcloud-url": getSettings("nextcloud-url"),
        "nextcloud-username": getSettings("nextcloud-username"),
        "nextcloud-password": getSettings("nextcloud-password"),
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
                    id="nextcloud-url"
                    label="NextCloud URL"
                    placeholder="https://nextcloud.example.com"
                    value={formData["nextcloud-url"]}
                    onChange={handleChange}
                ></CFormInput>
                <CFormInput className="mb-3"
                    type="text"
                    id="nextcloud-username"
                    label="NextCloud Username"
                    placeholder="diffusion-lab"
                    value={formData["nextcloud-username"]}
                    onChange={handleChange}
                />
                <CFormInput className="mb-3"
                    type="password"
                    id="nextcloud-password"
                    label="NextCloud Password"
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

