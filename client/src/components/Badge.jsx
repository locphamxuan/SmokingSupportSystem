import React from 'react';

// Import all badge SVG files
import badge1Day from '../assets/badges/badge-1day.svg';
import badge3Days from '../assets/badges/badge-3days.svg';
import badge5Days from '../assets/badges/badge-5days.svg';
import badge1Week from '../assets/badges/badge-1week.svg';
import badge2Weeks from '../assets/badges/badge-2weeks.svg';
import badge1Month from '../assets/badges/badge-1month.svg';
import badge2Months from '../assets/badges/badge-2months.svg';

const Badge = ({ badgeType, name, description, size = 64, showAnimation = false }) => {
  const getBadgeImage = (type) => {
    const badgeMap = {
      'loai1': badge1Day,
      'loai2': badge3Days, 
      'loai3': badge5Days,
      'loai4': badge1Week,
      'loai5': badge2Weeks,
      'loai6': badge1Month,
      'loai7': badge2Months
    };
    
    return badgeMap[type] || badgeMap['loai1'];
  };

  const badgeStyle = {
    width: size,
    height: size,
    cursor: 'pointer',
    transition: 'transform 0.3s ease',
    filter: showAnimation ? 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.6))' : 'none',
    animation: showAnimation ? 'pulse 2s infinite' : 'none'
  };

  return (
    <div 
      className="badge-container" 
      title={`${name} - ${description}`}
      style={{
        display: 'inline-block',
        margin: '4px',
        position: 'relative'
      }}
    >
      <img 
        src={getBadgeImage(badgeType)} 
        alt={name}
        style={badgeStyle}
        className={showAnimation ? 'badge-animated' : ''}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.filter = 'brightness(1.1) drop-shadow(0 0 15px rgba(255, 215, 0, 0.8))';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.filter = showAnimation ? 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.6))' : 'none';
        }}
      />
    </div>
  );
};

export default Badge; 