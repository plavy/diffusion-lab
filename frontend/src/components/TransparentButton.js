

const TranparentButton = ({ label, selected, ...props }) => {

  const styles = `
  .button-transparent {
    border: var(--cui-border-width) var(--cui-border-style);
    cursor: pointer;
  }
`

  return <div>
    <style>{styles}</style>
    <div {...props}
      className={`button-transparent rounded p-2 ${selected ? "border-secondary" : null}`}
      style={{ borderColor: selected ? null : "transparent" }}>
      {label}
    </div>
  </div>
}

export default TranparentButton;