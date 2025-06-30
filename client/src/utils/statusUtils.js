// Mapping trạng thái từ database sang hiển thị UI
export const getStatusDisplay = (status) => {
  // Normalize status first
  const normalizedStatus = normalizeStatus(status);
  
  const statusMap = {
    'pending': 'Chờ duyệt',
    'published': 'Đã duyệt'
  };
  
  return statusMap[normalizedStatus] || 'Chờ duyệt'; // Default to pending
};

// Normalize status values to handle any encoding issues
export const normalizeStatus = (status) => {
  if (!status) return 'pending';
  
  const statusStr = status.toString().toLowerCase().trim();
  
  // Handle various forms of "pending" status
  if (statusStr.includes('ch') || statusStr.includes('duy') || statusStr.includes('pending')) {
    return 'pending';
  }
  
  // Handle published status
  if (statusStr.includes('published') || statusStr.includes('pub')) {
    return 'published';
  }
  
  // Default to pending for unknown status
  return 'pending';
};

// Mapping trạng thái từ UI sang database
export const getStatusValue = (displayStatus) => {
  const valueMap = {
    'Chờ duyệt': 'pending',
    'Đã duyệt': 'published'
  };
  
  return valueMap[displayStatus] || displayStatus;
};

// Get badge variant cho React Bootstrap
export const getStatusBadgeVariant = (status) => {
  const normalizedStatus = normalizeStatus(status);
  
  switch (normalizedStatus) {
    case 'pending':
      return 'warning';
    case 'published':
      return 'success';
    default:
      return 'warning'; // Default to warning for unknown status
  }
};

// Get icon cho trạng thái
export const getStatusIcon = (status) => {
  const normalizedStatus = normalizeStatus(status);
  
  switch (normalizedStatus) {
    case 'pending':
      return 'fas fa-clock';
    case 'published':
      return 'fas fa-check-circle';
    default:
      return 'fas fa-clock'; // Default to clock for unknown status
  }
}; 