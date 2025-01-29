import { CFormLabel, CImage } from "@coreui/react";
import { useEffect, useRef } from "react";


const LabelImage = ({ svg, label, selected, ...props }) => {
  const svgWrapper = useRef();
  useEffect(() => {
    svgWrapper.current.innerHTML = svg;
  }, []);

  const styles = `
    .labelimage {
      border: var(--cui-border-width) var(--cui-border-style);
      cursor: pointer;
    }
  `

  return <div>
    <style>{styles}</style>
    <div {...props}
      className={`d-flex flex-column labelimage p-3 gap-3 rounded align-items-center ${selected ? "border-secondary" : null}`}
      style={{ borderColor: selected ? null : "transparent" }}>
      <div ref={svgWrapper}></div>
      <div>{label}</div>
    </div>
  </div>
}

export default LabelImage;