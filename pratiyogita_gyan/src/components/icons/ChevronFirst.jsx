import { useState } from "react";

const ChevronFirst = ({
  width = 15,
  height = 15,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        cursor: "pointer",
        userSelect: "none",
        padding: "2px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        stroke={stroke}
        strokeWidth={strokeWidth}
        viewBox="0 0 24 24"
        fill="none"
        width={width}
        height={height}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path
          d="m17 18-6-6 6-6"
          style={{
            transform: hovered ? "translateX(2px)" : "translateX(0)",
            transition: "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        />
        <path
          d="M7 6v12"
          style={{
            transform: hovered ? "translateX(-2px)" : "translateX(0)",
            transition: "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        />
      </svg>
    </div>
  );
};

export { ChevronFirst };
export default ChevronFirst;
