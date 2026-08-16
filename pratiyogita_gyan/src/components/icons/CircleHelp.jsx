import { useState } from "react";

const CircleHelp = ({
  width = 16,
  height = 16,
  strokeWidth = 2,
  stroke = "#000000",
  compact = true,
  style = {},
  ...props
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        cursor: "pointer",
        userSelect: "none",
        padding: compact ? "0px" : "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 0,
        ...style,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <circle cx="12" cy="12" r="10" />
        <g
          style={{
            transform: hovered ? "translateY(-2px)" : "translateY(0)",
            transition: "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        >
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </g>
      </svg>
    </div>
  );
};

export { CircleHelp };
export default CircleHelp;
