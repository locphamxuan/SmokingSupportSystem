import React from "react";

// Import all badge images
import badge1Day from "../assets/badges/huyhiệu1ngày.jpg";
import badge3Days from "../assets/badges/huyhiệu3ngày.jpg";
import badge5Days from "../assets/badges/huyhiệu5ngày.jpg";
import badge1Week from "../assets/badges/huyhiệu7ngày.jpg";
import badge2Weeks from "../assets/badges/huyhiệu14ngày.jpg";
import badge1Month from "../assets/badges/huyhiệu30ngày.jpg";
import badge2Months from "../assets/badges/huyhiệu60ngày.jpg";

const Badge = ({
  badgeType,
  name,
  description,
  size = 64,
  showAnimation = false,
}) => {
  const getBadgeImage = (type) => {
    const badgeMap = {
      loai1: badge1Day,
      loai2: badge3Days,
      loai3: badge5Days,
      loai4: badge1Week,
      loai5: badge2Weeks,
      loai6: badge1Month,
      loai7: badge2Months,
    };

    return badgeMap[type] || badgeMap["loai1"];
  };

  const badgeStyle = {
    width: size,
    height: size,
    cursor: "pointer",
    transition: "transform 0.3s ease",
    filter: showAnimation
      ? "drop-shadow(0 0 10px rgba(255, 215, 0, 0.6))"
      : "none",
    animation: showAnimation ? "pulse 2s infinite" : "none",
    objectFit: "contain",
    background: "transparent", // Đảm bảo không có background
  };

  return (
    <div
      className="badge-container"
      style={{
        display: "inline-block",
        margin: "4px",
        position: "relative",
        background: "transparent", // Đảm bảo container cũng không có background
      }}
    >
      <img
        src={getBadgeImage(badgeType)}
        alt={name || "Badge"}
        style={badgeStyle}
        className={showAnimation ? "badge-animated" : ""}
        onMouseEnter={(e) => {
          e.target.style.transform = "scale(1.1)";
          e.target.style.filter =
            "brightness(1.1) drop-shadow(0 0 15px rgba(255, 215, 0, 0.8))";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "scale(1)";
          e.target.style.filter = showAnimation
            ? "drop-shadow(0 0 10px rgba(255, 215, 0, 0.6))"
            : "none";
        }}
      />
    </div>
  );
};

export default Badge;
