import React, { useEffect, useState } from 'react';
import {
  getAllPosts,
  updatePostStatus,
  deletePost,
  getPostDetail
} from '../services/adminService';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Badge, 
  Modal, 
  Alert,
  Spinner,
  Form
} from 'react-bootstrap';
import { 
  getStatusDisplay, 
  getStatusValue, 
  getStatusBadgeVariant, 
  getStatusIcon 
} from '../utils/statusUtils';
import BadgeComponent from '../components/Badge';
import '../style/AdminPostsPage.scss';

const AdminPostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllPosts();
      setPosts(data);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Không thể tải danh sách bài viết');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleStatusChange = async (postId, newStatus) => {
    setError('');
    setSuccess('');
    try {
      // Convert display status to database value
      const dbStatus = getStatusValue(newStatus) || newStatus;
      await updatePostStatus(postId, dbStatus);
      setSuccess(`Đã ${newStatus === 'published' ? 'duyệt' : 'chuyển về chờ duyệt'} bài viết thành công!`);
      fetchPosts(); // Refresh the list
    } catch (err) {
      console.error('Error updating post status:', err);
      setError('Lỗi khi cập nhật trạng thái bài viết');
    }
  };

  const handleViewDetail = async (postId) => {
    setError('');
    try {
      const postDetail = await getPostDetail(postId);
      setSelectedPost(postDetail);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Error fetching post detail:', err);
      setError('Không thể tải chi tiết bài viết');
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    
    setError('');
    setSuccess('');
    try {
      await deletePost(postToDelete.Id);
      setSuccess('Đã xóa bài viết thành công!');
      setShowDeleteModal(false);
      setPostToDelete(null);
      fetchPosts(); // Refresh the list
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Lỗi khi xóa bài viết');
    }
  };

  const getStatusBadge = (status) => {
    const variant = getStatusBadgeVariant(status);
    const displayText = getStatusDisplay(status);
    const icon = getStatusIcon(status);
    
    return (
      <Badge bg={variant}>
        <i className={`${icon} me-1`}></i>
        {displayText}
      </Badge>
    );
  };

  const filteredPosts = posts.filter(post => {
    if (statusFilter === 'all') return true;
    return post.Status === statusFilter;
  });

  const pendingCount = posts.filter(p => p.Status === 'pending').length;
  const publishedCount = posts.filter(p => p.Status === 'published').length;

  return (
    <Container fluid className="admin-posts-page">
      <Row>
        <Col>
          <div className="page-header">
            <h2>
              <i className="fas fa-newspaper me-2"></i>
              Quản lý bài viết
            </h2>
            <p className="text-muted">Duyệt và quản lý các bài viết từ cộng đồng</p>
          </div>

          {/* Statistics Cards */}
          <Row className="mb-4">
            <Col md={4}>
              <Card className="stats-card pending">
                <Card.Body>
                  <div className="stats-content">
                    <div className="stats-icon">
                      <i className="fas fa-clock"></i>
                    </div>
                    <div className="stats-info">
                      <h3>{pendingCount}</h3>
                      <p>Chờ duyệt</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="stats-card published">
                <Card.Body>
                  <div className="stats-content">
                    <div className="stats-icon">
                      <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stats-info">
                      <h3>{publishedCount}</h3>
                      <p>Đã duyệt</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="stats-card total">
                <Card.Body>
                  <div className="stats-content">
                    <div className="stats-icon">
                      <i className="fas fa-newspaper"></i>
                    </div>
                    <div className="stats-info">
                      <h3>{posts.length}</h3>
                      <p>Tổng bài viết</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Alerts */}
          {error && (
            <Alert variant="danger" onClose={() => setError('')} dismissible>
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" onClose={() => setSuccess('')} dismissible>
              {success}
            </Alert>
          )}

          {/* Filter */}
          <Card className="mb-4">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Lọc theo trạng thái:</Form.Label>
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{ width: 'auto', display: 'inline-block' }}
                    >
                      <option value="all">Tất cả ({posts.length})</option>
                      <option value="pending">Chờ duyệt ({pendingCount})</option>
                      <option value="published">Đã duyệt ({publishedCount})</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6} className="text-end">
                  <Button variant="outline-secondary" onClick={fetchPosts} disabled={loading}>
                    <i className="fas fa-sync-alt me-2"></i>
                    Làm mới
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Posts Table */}
          <Card>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                  </Spinner>
                  <p className="mt-2">Đang tải danh sách bài viết...</p>
                </div>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Tiêu đề</th>
                      <th>Nội dung</th>
                      <th className="badge-column">Huy hiệu</th>
                      <th>Tác giả</th>
                      <th>Trạng thái</th>
                      <th>Ngày tạo</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPosts.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-4">
                          <i className="fas fa-inbox fa-2x text-muted mb-2"></i>
                          <p className="text-muted">Không có bài viết nào</p>
                        </td>
                      </tr>
                    ) : (
                      filteredPosts.map((post, index) => (
                        <tr key={post.Id}>
                          <td>{index + 1}</td>
                          <td>
                            <div className="post-title">
                              {post.Title}
                            </div>
                          </td>
                          <td>
                            <div className="post-content-preview">
                              {post.Content.length > 150 
                                ? `${post.Content.substring(0, 150)}...` 
                                : post.Content
                              }
                            </div>
                          </td>
                          <td className="badge-column">
                            {post.BadgeId && post.BadgeName ? (
                              <div className="badge-display">
                                <BadgeComponent 
                                  badgeType={post.BadgeType} 
                                  name={post.BadgeName} 
                                  description={post.BadgeDescription}
                                  size={48}
                                  showAnimation={true}
                                />
                                <div className="badge-name">
                                  {post.BadgeName}
                                </div>
                              </div>
                            ) : (
                              <div className="badge-display">
                                <i className="fas fa-minus-circle text-muted" style={{fontSize: '20px'}}></i>
                                <span className="no-badge">Không có</span>
                              </div>
                            )}
                          </td>
                          <td>{post.Author}</td>
                          <td>{getStatusBadge(post.Status)}</td>
                          <td>
                            <div className="date-display">
                              {(() => {
                                // Parse trực tiếp từ string để tránh vấn đề timezone
                                const dateString = post.CreatedAt;
                                if (dateString.includes('T') || dateString.includes(' ')) {
                                  const [datePart] = dateString.split(/[T ]/);
                                  const [year, month, day] = datePart.split('-');
                                  return `${day}/${month}/${year}`;
                                }
                                // Fallback nếu format khác
                                const date = new Date(post.CreatedAt);
                                const day = String(date.getDate()).padStart(2, '0');
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const year = date.getFullYear();
                                return `${day}/${month}/${year}`;
                              })()}
                              <small className="d-block text-muted">
                                {(() => {
                                  // Parse giờ phút từ string
                                  const dateString = post.CreatedAt;
                                  if (dateString.includes('T') || dateString.includes(' ')) {
                                    const timePart = dateString.split(/[T ]/)[1];
                                    if (timePart) {
                                      const [hours, minutes] = timePart.split(':');
                                      return `${hours}:${minutes}`;
                                    }
                                  }
                                  // Fallback nếu format khác
                                  const date = new Date(post.CreatedAt);
                                  const hours = String(date.getHours()).padStart(2, '0');
                                  const minutes = String(date.getMinutes()).padStart(2, '0');
                                  return `${hours}:${minutes}`;
                                })()}
                              </small>
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => handleViewDetail(post.Id)}
                                className="me-1"
                              >
                                <i className="fas fa-eye"></i>
                              </Button>
                              
                              {post.Status === 'pending' ? (
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleStatusChange(post.Id, 'published')}
                                  className="me-1"
                                >
                                  <i className="fas fa-check"></i>
                                </Button>
                              ) : (
                                <Button
                                  variant="warning"
                                  size="sm"
                                  onClick={() => handleStatusChange(post.Id, 'pending')}
                                  className="me-1"
                                >
                                  <i className="fas fa-undo"></i>
                                </Button>
                              )}
                              
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  setPostToDelete(post);
                                  setShowDeleteModal(true);
                                }}
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Post Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết bài viết</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPost && (
            <div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="mb-0">{selectedPost.Title}</h5>
                  {selectedPost.BadgeId && selectedPost.BadgeName && (
                    <div className="text-center">
                      <BadgeComponent 
                        badgeType={selectedPost.BadgeType} 
                        name={selectedPost.BadgeName} 
                        description={selectedPost.BadgeDescription}
                        size={64}
                        showAnimation={true}
                      />
                      <div className="mt-2">
                        <small className="text-success fw-bold">
                          <i className="fas fa-medal me-1" style={{color: '#ffd700'}}></i>
                          {selectedPost.BadgeName}
                        </small>
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedPost.BadgeId && selectedPost.BadgeName && (
                  <div className="alert alert-success mb-3" style={{
                    background: 'linear-gradient(135deg, #d4f8d4, #f0fff0)',
                    border: '2px solid #28a745',
                    borderRadius: '10px'
                  }}>
                    <div className="d-flex align-items-center">
                      <i className="fas fa-medal me-2" style={{
                        color: '#ffd700', 
                        fontSize: '18px',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                      }}></i>
                      <div>
                        <strong className="text-success">🏆 Khách hàng đã chia sẻ thành tích:</strong>
                        <br />
                                                 <span className="fw-bold" style={{color: '#155724'}}>
                           &ldquo;{selectedPost.BadgeName}&rdquo; - {selectedPost.BadgeDescription}
                         </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <p className="text-muted">
                  Tác giả: <strong>{selectedPost.Author}</strong> | 
                  Ngày tạo: <strong>
                    {(() => {
                      // Parse trực tiếp từ string để tránh vấn đề timezone
                      const dateString = selectedPost.CreatedAt;
                      if (dateString.includes('T') || dateString.includes(' ')) {
                        const [datePart, timePart] = dateString.split(/[T ]/);
                        const [year, month, day] = datePart.split('-');
                        const [hours, minutes] = timePart ? timePart.split(':') : ['00', '00'];
                        return `${day}/${month}/${year} ${hours}:${minutes}`;
                      }
                      // Fallback nếu format khác
                      const date = new Date(selectedPost.CreatedAt);
                      const day = String(date.getDate()).padStart(2, '0');
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const year = date.getFullYear();
                      const hours = String(date.getHours()).padStart(2, '0');
                      const minutes = String(date.getMinutes()).padStart(2, '0');
                      return `${day}/${month}/${year} ${hours}:${minutes}`;
                    })()}
                  </strong> | 
                  Trạng thái: {getStatusBadge(selectedPost.Status)}
                </p>
              </div>
              
              <div className="mb-4">
                <h6>Nội dung:</h6>
                <div className="post-content">
                  {selectedPost.Content}
                </div>
              </div>
              
              {selectedPost.Comments && selectedPost.Comments.length > 0 && (
                <div>
                  <h6>Bình luận ({selectedPost.Comments.length}):</h6>
                  <div className="comments-list">
                    {selectedPost.Comments.map((comment, index) => (
                      <div key={comment.Id} className="comment-item">
                        <strong>{comment.Author}</strong>
                        <small className="text-muted ms-2">
                          {(() => {
                            // Parse trực tiếp từ string để tránh vấn đề timezone
                            const dateString = comment.CreatedAt;
                            if (dateString.includes('T') || dateString.includes(' ')) {
                              const [datePart, timePart] = dateString.split(/[T ]/);
                              const [year, month, day] = datePart.split('-');
                              const [hours, minutes] = timePart ? timePart.split(':') : ['00', '00'];
                              return `${day}/${month}/${year} ${hours}:${minutes}`;
                            }
                            // Fallback nếu format khác
                            const date = new Date(comment.CreatedAt);
                            const day = String(date.getDate()).padStart(2, '0');
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const year = date.getFullYear();
                            const hours = String(date.getHours()).padStart(2, '0');
                            const minutes = String(date.getMinutes()).padStart(2, '0');
                            return `${day}/${month}/${year} ${hours}:${minutes}`;
                          })()}
                        </small>
                        <p className="mb-1">{comment.Content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selectedPost && (
            <>
              {selectedPost.Status === 'pending' ? (
                <Button
                  variant="success"
                  onClick={() => {
                    handleStatusChange(selectedPost.Id, 'published');
                    setShowDetailModal(false);
                  }}
                >
                  <i className="fas fa-check me-2"></i>
                  Duyệt bài viết
                </Button>
              ) : (
                <Button
                  variant="warning"
                  onClick={() => {
                    handleStatusChange(selectedPost.Id, 'pending');
                    setShowDetailModal(false);
                  }}
                >
                  <i className="fas fa-undo me-2"></i>
                  Chuyển về chờ duyệt
                </Button>
              )}
            </>
          )}
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {postToDelete && (
            <div>
              <p>Bạn có chắc chắn muốn xóa bài viết này không?</p>
              <div className="alert alert-warning">
                <strong>Tiêu đề:</strong> {postToDelete.Title}<br/>
                <strong>Tác giả:</strong> {postToDelete.Author}
              </div>
              <p className="text-danger">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Hành động này không thể hoàn tác!
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleDeletePost}>
            <i className="fas fa-trash me-2"></i>
            Xóa bài viết
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminPostsPage; 