import React from 'react';
import PropTypes from 'prop-types';
import "../style/StatCard.scss";

const StatCard = ({ title, data, icon, className, loading }) => {
  if (loading) {
    return (
      <div className={`stat-card ${className || ''}`}>
        <div className="stat-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`stat-card ${className || ''}`}>
      <div className="stat-card-header">
        {icon && <i className={`bi bi-${icon} stat-icon`}></i>}
        <h3 className="stat-title">{title}</h3>
      </div>
      <div className="stat-content">
        {Array.isArray(data) && data.map((item, index) => (
          <div key={index} className="stat-item">
            <span className="stat-label">{item.label}</span>
            <span className="stat-value">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
      ]).isRequired
    })
  ).isRequired,
  icon: PropTypes.string,
  className: PropTypes.string,
  loading: PropTypes.bool
};

StatCard.defaultProps = {
  loading: false,
  data: []
};

export default StatCard;