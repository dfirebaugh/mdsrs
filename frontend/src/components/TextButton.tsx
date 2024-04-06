import { useState } from 'react';
import "./TextButton.css";

export default function TextButton({ title, onClick, className, width, height, hoverTitle }: {
  title: string,
  hoverTitle?: string,
  onClick?: () => void,
  className?: string,
  width?: string,
  height?: string
}) {
  const [isHovered, setIsHovered] = useState(false);

  const buttonText = isHovered && hoverTitle ? hoverTitle : title;

  return (
    <button
      className={`text-button ${className || ''}`}
      style={{ width, height }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {buttonText}
    </button>
  );
}