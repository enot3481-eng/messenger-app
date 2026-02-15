import React from 'react';

interface IconProps {
  name: 'call' | 'chat' | 'video' | 'clip' | 'send' | 'micro';
  className?: string;
  size?: number;
  onClick?: () => void;
}

export const Icon: React.FC<IconProps> = ({ name, className = '', size = 24, onClick }) => {
  const iconPath = `/icons/${name}.png`;
  
  return (
    <img
      src={iconPath}
      alt={name}
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'contain',
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    />
  );
};