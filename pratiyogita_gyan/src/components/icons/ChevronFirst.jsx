import React from 'react';

export const ChevronFirst = ({
  width = 16,
  height = 16,
  strokeWidth = 2,
  stroke = "#000000",
  ...props
}) => (
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
    <polyline points="17 18 11 12 17 6" />
    <path d="M7 6v12" />
  </svg>
);

export default ChevronFirst;
