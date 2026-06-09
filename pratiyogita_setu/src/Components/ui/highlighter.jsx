import React from "react";

export function Highlighter({ children, action = "highlight", color = "#E4572E" }) {
  const styles = {
    underline: {
      textDecoration: `underline wavy ${color}`,
      textUnderlineOffset: "4px",
      textDecorationThickness: "2px",
      background: "none",
      color: "inherit",
      fontWeight: 600,
      padding: 0,
    },
    highlight: {
      background: color,
      color: "#222",
      borderRadius: "0.3em",
      fontWeight: 700,
      padding: "0.1em 0.3em",
      boxDecorationBreak: "clone",
      WebkitBoxDecorationBreak: "clone",
    },
  };
  return (
    <span style={action === "underline" ? styles.underline : styles.highlight}>
      {children}
    </span>
  );
}
