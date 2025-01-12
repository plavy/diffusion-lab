import { CButton, CSpinner } from "@coreui/react";


const LoadingButton = ({loadingVisible, ...props}) => (
  <CButton {...props} disabled={loadingVisible}>
    {loadingVisible ? <CSpinner className="me-1" size="sm" /> : null}
    {props.children}</CButton>
)


export default LoadingButton;