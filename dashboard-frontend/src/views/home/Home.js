import { CButton } from "@coreui/react"
import NewServerModal from "../servers/NewServerModal"
import { useState } from "react";

const Home = () => {
    const [newServerModalVisible, setNewServerModalVisible] = useState(false);
    

    return (
        <>
            <NewServerModal modalVisible={newServerModalVisible} setModalVisible={setNewServerModalVisible}></NewServerModal>
            <CButton color="primary" onClick={() => setNewServerModalVisible(true)}>Add new server</CButton>
        </>
    )
}

export default Home
