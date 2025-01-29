import { CButton, CSpinner } from "@coreui/react";


const LoadingButton = ({loadingVisible, disabled, ...props}) => (
  <CButton {...props} disabled={loadingVisible || disabled}>
    {loadingVisible ? <CSpinner className="me-1" size="sm" /> : null}
    {props.children}</CButton>
)

export default LoadingButton;