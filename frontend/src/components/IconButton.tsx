import { Icon } from '@iconify-icon/react';
import "./IconButton.css";
import { useState } from 'react';

export default function IconButton({ title, icon, hoverIcon, onClick, className, width, height }: {
  title?: string,
  icon?: string,
  hoverIcon?: string,
  onClick?: () => void,
  className?: string,
  width?: string,
  height?: string
}) {
  const [isHovered, setIsHovered] = useState(false);

  const ic = isHovered && !!hoverIcon ? hoverIcon : icon

  return (
    <Icon
      title={title}
      className="icon-button"
      icon={ic || ""}
      width={width}
      height={height}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)} />
  );
}
