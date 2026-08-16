import { useState } from "react";

const Network = ({
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
        <rect x="16" y="16" width="6" height="6" rx="1" />
        <rect x="2" y="16" width="6" height="6" rx="1" />
        <rect x="9" y="2" width="6" height="6" rx="1" />
        <path
          d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"
          style={{
            strokeDasharray: 100,
            strokeDashoffset: hovered ? 0 : 0,
            opacity: hovered ? 1 : 1,
            transition: "all 0.25s ease 0.1s",
          }}
        />
        <path
          d="M12 12V8"
          style={{
            strokeDasharray: 100,
            strokeDashoffset: hovered ? 0 : 0,
            opacity: hovered ? 1 : 1,
            transition: "all 0.25s ease 0.35s",
          }}
        />
      </svg>
    </div>
  );
};

export { Network };
export default Network;
