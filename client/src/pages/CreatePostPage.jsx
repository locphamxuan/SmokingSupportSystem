import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Button,
  Form,
  Alert as BAlert,
  Spinner,
  Card,
  Row,
  Col,
  Badge,
  Table
} from "react-bootstrap";
import { createPost, getUserPosts, getUserBadges } from '../services/authService';
import { 
  getStatusDisplay, 
  getStatusBadgeVariant, 
  getStatusIcon 
} from '../utils/statusUtils';
import '../style/CreatePostPage.scss';

const CreatePostPage = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedBadgeId, setSelectedBadgeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userPosts, setUserPosts] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingBadges, setLoadingBadges] = useState(false);
  const navigate = useNavigate();

  // Fetch user's posts and badges on component mount
  useEffect(() => {
    fetchUserPosts();
    fetchUserBadges();
  }, []);

  const fetchUserPosts = async () => {
    setLoadingPosts(true);
    try {
      const posts = await getUserPosts();
      setUserPosts(posts);
    } catch (err) {
      console.error('Error fetching user posts:', err);
    }
    setLoadingPosts(false);
  };

  const fetchUserBadges = async () => {
    setLoadingBadges(true);
    try {
      const response = await getUserBadges();
      setUserBadges(response.badges || []);
    } catch (err) {
      console.error('Error fetching user badges:', err);
    }
    setLoadingBadges(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Vui lòng điền đầy đủ tiêu đề và nội dung');
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const postData = { 
        title: title.trim(), 
        content: content.trim()
      };
      
      // Thêm badgeId nếu được chọn
      if (selectedBadgeId) {
        postData.badgeId = parseInt(selectedBadgeId);
      }
      
      console.log('Debug - Sending post data:', postData);
      console.log('Debug - Selected badge ID:', selectedBadgeId);
      
      const response = await createPost(postData);
      console.log('Debug - Response from server:', response);
      setSuccess(response.message || 'Bài đăng đã được gửi thành công!');
      setTitle("");
      setContent("");
      setSelectedBadgeId("");
      
      // Refresh user posts to show the new post
      await fetchUserPosts();
      
      // Auto hide success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
      
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo bài đăng');
    }

    setLoading(false);
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

  const pendingPosts = userPosts.filter(post => post.Status === 'pending');
  const publishedPosts = userPosts.filter(post => post.Status === 'published');

  return (
    <Container className="create-post-page">
      <Row>
        <Col lg={8}>
          <Card className="create-post-card">
            <Card.Header>
              <h4>
                <i className="fas fa-pen-alt me-2"></i>
                Tạo bài viết mới
              </h4>
              <p className="text-muted mb-0">Chia sẻ câu chuyện và kinh nghiệm của bạn với cộng đồng</p>
            </Card.Header>
            <Card.Body>
              {error && (
                <BAlert variant="danger" onClose={() => setError('')} dismissible>
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </BAlert>
              )}
              
              {success && (
                <BAlert variant="success" onClose={() => setSuccess('')} dismissible>
                  <i className="fas fa-check-circle me-2"></i>
                  {success}
                </BAlert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <i className="fas fa-heading me-2"></i>
                    Tiêu đề bài viết
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nhập tiêu đề bài viết..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={200}
                  />
                  <Form.Text className="text-muted">
                    {title.length}/200 ký tự
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>
                    <i className="fas fa-align-left me-2"></i>
                    Nội dung
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={8}
                    placeholder="Chia sẻ câu chuyện, kinh nghiệm của bạn..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={2000}
                  />
                  <Form.Text className="text-muted">
                    {content.length}/2000 ký tự
                  </Form.Text>
                </Form.Group>

                {/* Badge Selection */}
                <Form.Group className="mb-4">
                  <Form.Label>
                    <i className="fas fa-medal me-2"></i>
                    Chia sẻ huy hiệu (tùy chọn)
                  </Form.Label>
                  {loadingBadges ? (
                    <div className="text-center py-2">
                      <Spinner animation="border" size="sm" className="me-2" />
                      <span>Đang tải huy hiệu...</span>
                    </div>
                  ) : userBadges.length > 0 ? (
                    <>
                      <Form.Select 
                        value={selectedBadgeId} 
                        onChange={(e) => setSelectedBadgeId(e.target.value)}
                      >
                        <option value="">Không chia sẻ huy hiệu</option>
                        {userBadges.map((badge) => (
                          <option key={badge.Id} value={badge.Id}>
                            {badge.Name} - {badge.Description}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Bạn có thể chia sẻ một trong những huy hiệu đã đạt được để thể hiện thành tích của mình
                      </Form.Text>
                    </>
                  ) : (
                    <div className="text-muted small">
                      <i className="fas fa-info-circle me-1"></i>
                      Bạn chưa có huy hiệu nào. Hãy tiếp tục cai thuốc để nhận huy hiệu đầu tiên!
                    </div>
                  )}
                </Form.Group>

                <div className="d-flex justify-content-between align-items-center">
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate('/community')}
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    Quay lại
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading || !title.trim() || !content.trim()}
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          className="me-2"
                        />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-2"></i>
                        Gửi bài viết
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="my-posts-card">
            <Card.Header>
              <h5>
                <i className="fas fa-list me-2"></i>
                Bài viết của tôi
              </h5>
            </Card.Header>
            <Card.Body>
              {loadingPosts ? (
                <div className="text-center py-3">
                  <Spinner animation="border" size="sm" />
                  <p className="mt-2 mb-0 text-muted">Đang tải...</p>
                </div>
              ) : userPosts.length === 0 ? (
                <div className="text-center py-3">
                  <i className="fas fa-inbox fa-2x text-muted mb-2"></i>
                  <p className="text-muted mb-0">Bạn chưa có bài viết nào</p>
                  <small className="text-muted">Hãy tạo bài viết đầu tiên!</small>
                </div>
              ) : (
                <>
                  <div className="posts-stats mb-3">
                    <div className="stat-item">
                      <span className="stat-number">{pendingPosts.length}</span>
                      <span className="stat-label">Chờ duyệt</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{publishedPosts.length}</span>
                      <span className="stat-label">Đã duyệt</span>
                    </div>
                  </div>

                  <div className="posts-list">
                    {userPosts.map((post) => (
                      <div key={post.Id} className="post-item">
                        <div className="post-header">
                          <h6 className="post-title">{post.Title}</h6>
                          {getStatusBadge(post.Status)}
                        </div>
                        <p className="post-preview">
                          {post.Content.length > 100 
                            ? `${post.Content.substring(0, 100)}...` 
                            : post.Content
                          }
                        </p>
                        <small className="post-date">
                          <i className="fas fa-calendar-alt me-1"></i>
                          {(() => {
                            // Parse trực tiếp từ string để tránh vấn đề timezone
                            const dateString = post.CreatedAt;
                            if (dateString.includes('T') || dateString.includes(' ')) {
                              const [datePart, timePart] = dateString.split(/[T ]/);
                              const [year, month, day] = datePart.split('-');
                              const [hours, minutes] = timePart ? timePart.split(':') : ['00', '00'];
                              return `${day}/${month}/${year} ${hours}:${minutes}`;
                            }
                            // Fallback nếu format khác
                            const date = new Date(post.CreatedAt);
                            const day = String(date.getDate()).padStart(2, '0');
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const year = date.getFullYear();
                            const hours = String(date.getHours()).padStart(2, '0');
                            const minutes = String(date.getMinutes()).padStart(2, '0');
                            return `${day}/${month}/${year} ${hours}:${minutes}`;
                          })()}
                        </small>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card.Body>
          </Card>

          {/* Information Card */}
          <Card className="info-card mt-3">
            <Card.Header>
              <h6>
                <i className="fas fa-info-circle me-2"></i>
                Thông tin duyệt bài
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="info-item">
                <i className="fas fa-clock text-warning me-2"></i>
                <div>
                  <strong>Chờ duyệt:</strong>
                  <p className="mb-0 text-muted small">
                    Bài viết đang được quản trị viên xem xét
                  </p>
                </div>
              </div>
              
              <div className="info-item">
                <i className="fas fa-check-circle text-success me-2"></i>
                <div>
                  <strong>Đã duyệt:</strong>
                  <p className="mb-0 text-muted small">
                    Bài viết đã được công khai trên cộng đồng
                  </p>
                </div>
              </div>
              
              <BAlert variant="info" className="mt-3 mb-0">
                <small>
                  <i className="fas fa-lightbulb me-1"></i>
                  <strong>Mẹo:</strong> Bài viết có nội dung tích cực, hữu ích sẽ được duyệt nhanh hơn!
                </small>
              </BAlert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CreatePostPage; 