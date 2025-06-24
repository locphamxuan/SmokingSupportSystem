import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Alert,
  ListGroup,
  ListGroupItem,
  Form,
  Button,
  Badge
} from "react-bootstrap";

import axios from "axios";
import { useLocation, Link } from 'react-router-dom';

// CSS styles
const styles = `
  .hover-shadow {
    transition: all 0.3s ease;
  }
  
  .hover-shadow:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
  }
  
  .transition-all {
    transition: all 0.3s ease;
  }
  
  .card-hover-effect:hover {
    border-color: #007bff !important;
  }
  
  .btn-lg {
    padding: 12px 30px;
    font-size: 1.1rem;
  }
  
  .social-icons a img:hover {
    transform: scale(1.1);
    transition: transform 0.3s ease;
  }
  
  .community-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

// Data về lợi ích cai thuốc
const benefitsData = [
  {
    icon: <i className="fas fa-heart text-danger fs-4"></i>,
    title: "Cải thiện sức khỏe tim mạch",
    description: "Sau 20 phút: Nhịp tim và huyết áp giảm. Sau 12 giờ: Nồng độ CO trong máu trở về bình thường. Sau 1 năm: Nguy cơ bệnh tim giảm 50%.",
    timeframe: "Ngay lập tức"
  },
  {
    icon: <i className="fas fa-lungs text-primary fs-4"></i>,
    title: "Phục hồi chức năng phổi",
    description: "Sau 2-12 tuần: Lưu thông máu cải thiện, chức năng phổi tăng lên. Ho và khó thở giảm đáng kể.",
    timeframe: "2-12 tuần"
  },
  {
    icon: <i className="fas fa-money-bill-wave text-success fs-4"></i>,
    title: "Tiết kiệm tiền bạc",
    description: "Một người hút 1 gói/ngày có thể tiết kiệm 7-10 triệu VNĐ mỗi năm. Tiền này có thể dùng cho những mục đích có ý nghĩa khác.",
    timeframe: "Hàng ngày"
  },
  {
    icon: <i className="fas fa-smile text-warning fs-4"></i>,
    title: "Cải thiện tâm trạng",
    description: "Giảm căng thẳng, lo âu. Cải thiện chất lượng giấc ngủ. Tăng cường sự tự tin và hạnh phúc.",
    timeframe: "1-3 tháng"
  },
  {
    icon: <i className="fas fa-shield-alt text-info fs-4"></i>,
    title: "Giảm nguy cơ ung thư",
    description: "Sau 5 năm: Nguy cơ ung thư miệng, họng giảm 50%. Sau 10 năm: Nguy cơ ung thư phổi giảm 50%.",
    timeframe: "5-10 năm"
  },
  {
    icon: <i className="fas fa-users text-secondary fs-4"></i>,
    title: "Bảo vệ người thân",
    description: "Loại bỏ khói thuốc thụ động, bảo vệ sức khỏe gia đình và con em. Tạo môi trường sống trong lành hơn.",
    timeframe: "Ngay lập tức"
  }
];

// Data về tác hại của thuốc lá
const harmfulEffectsData = [
  {
    icon: <i className="fas fa-skull-crossbones text-danger fs-4"></i>,
    title: "Ung thư",
    description: "Thuốc lá chứa hơn 70 chất gây ung thư. Nguy cơ ung thư phổi cao gấp 15-25 lần so với người không hút.",
    severity: "Rất nghiêm trọng"
  },
  {
    icon: <i className="fas fa-heartbeat text-danger fs-4"></i>,
    title: "Bệnh tim mạch",
    description: "Tăng nguy cơ đột quỵ, nhồi máu cơ tim, bệnh mạch máu ngoại biên. Làm tăng huyết áp và cholesterol xấu.",
    severity: "Nghiêm trọng"
  },
  {
    icon: <i className="fas fa-lungs text-danger fs-4"></i>,
    title: "Bệnh phổi tắc nghẽn mãn tính",
    description: "Gây khó thở, ho mãn tính, đờm nhiều. Làm giảm chức năng phổi không thể phục hồi hoàn toàn.",
    severity: "Nghiêm trọng"
  },
  {
    icon: <i className="fas fa-baby text-warning fs-4"></i>,
    title: "Ảnh hưởng thai nhi",
    description: "Thai nhi có thể bị sinh non, nhẹ cân, dị tật bẩm sinh. Tăng nguy cơ sẩy thai và thai chết lưu.",
    severity: "Rất nghiêm trọng"
  },
  {
    icon: <i className="fas fa-tooth text-secondary fs-4"></i>,
    title: "Vấn đề răng miệng",
    description: "Gây vàng răng, hôi miệng, viêm nướu, rụng răng sớm. Tăng nguy cơ ung thư miệng và họng.",
    severity: "Trung bình"
  },
  {
    icon: <i className="fas fa-eye text-info fs-4"></i>,
    title: "Tác hại khác",
    description: "Lão hóa da sớm, giảm khả năng ngửi và nếm. Ảnh hưởng khả năng sinh sản. Giảm mật độ xương.",
    severity: "Trung bình"
  }
];

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState(null);
  const [comments, setComments] = useState({});
  const [newCommentContent, setNewCommentContent] = useState({});

  const location = useLocation(); // Hook để truy cập trạng thái vị trí

  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const response = await axios.get("http://localhost:5000/api/auth/posts");
      setPosts(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError("Không thể tải bài viết. Vui lòng thử lại sau.");
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr && userStr !== 'undefined') {
        setUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }

    fetchPosts();

    // Kiểm tra nếu được chuyển hướng từ CreatePostPage với thành công
    if (location.state?.postCreated) {
      setSuccess("Bài đăng đã được tạo thành công!");
      // Xóa trạng thái để không hiển thị lại khi làm mới
      window.history.replaceState({}, document.title);
    }
  }, [fetchPosts, location.state?.postCreated]); // Thêm location.state.postCreated làm dependency

  const handleCloseSnackbar = () => {
    setError("");
    setSuccess("");
  };

  const getSeverityVariant = (severity) => {
    switch (severity) {
      case "Rất nghiêm trọng": return "danger";
      case "Nghiêm trọng": return "warning";
      case "Trung bình": return "secondary";
      default: return "light";
    }
  };

  const getTimeframeVariant = (timeframe) => {
    switch (timeframe) {
      case "Ngay lập tức": return "success";
      case "Hàng ngày": return "primary";
      case "2-12 tuần": return "info";
      case "1-3 tháng": return "warning";
      case "5-10 năm": return "secondary";
      default: return "light";
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <style>{styles}</style>
      <main className="flex-grow-1"> 
        <Container className="my-4"> 
          
          {success && (
            <Alert variant="success" onClose={handleCloseSnackbar} dismissible className="my-3">
              {success}
            </Alert>
          )}
          {error && (
            <Alert variant="danger" onClose={handleCloseSnackbar} dismissible className="my-3">
              {error}
            </Alert>
          )}

          {/* Header Section */}
          <div className="text-center mb-5">
            <h1 className="display-4 text-primary fw-bold mb-3">🌟 Cộng Đồng Cai Thuốc 🌟</h1>
            <p className="lead text-muted">
              Khám phá thông tin hữu ích và chia sẻ hành trình cai thuốc cùng cộng đồng
            </p>
          </div>

          {/* Tác hại của thuốc lá */}
          <div className="mb-5">
            <div className="text-center mb-4">
              <h2 className="text-danger fw-bold">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Tác Hại Của Thuốc Lá
              </h2>
              <p className="text-muted">Hiểu rõ tác hại để có động lực cai thuốc</p>
            </div>
            <Row xs={1} md={2} lg={3} className="g-4">
              {harmfulEffectsData.map((harm, index) => (
                <Col key={index}>
                  <Card className="h-100 shadow-sm border-0 hover-shadow transition-all">
                    <Card.Body className="p-4">
                      <div className="d-flex align-items-center mb-3">
                        {harm.icon}
                        <h5 className="ms-3 fw-bold mb-0 text-dark">
                          {harm.title}
                        </h5>
                      </div>
                      <Card.Text className="text-secondary mb-3" style={{lineHeight: '1.6'}}>
                        {harm.description}
                      </Card.Text>
                      <Badge bg={getSeverityVariant(harm.severity)} className="px-3 py-2">
                        <i className="fas fa-warning me-1"></i>
                        {harm.severity}
                      </Badge>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          <hr className="my-5" style={{height: '3px', background: 'linear-gradient(90deg, #dc3545, #28a745)'}} />

          {/* Lợi ích của việc cai thuốc */}
          <div className="mb-5"> 
            <div className="text-center mb-4">
              <h2 className="text-success fw-bold">
                <i className="fas fa-leaf me-2"></i>
                Lợi Ích Của Việc Cai Thuốc
              </h2>
              <p className="text-muted">Những thay đổi tích cực khi bạn ngừng hút thuốc</p>
            </div>
            <Row xs={1} md={2} lg={3} className="g-4"> 
              {benefitsData.map((benefit, index) => (
                <Col key={index}> 
                  <Card className="h-100 shadow-sm border-0 hover-shadow transition-all"> 
                    <Card.Body className="p-4"> 
                      <div className="d-flex align-items-center mb-3"> 
                        {benefit.icon}
                        <h5 className="ms-3 fw-bold mb-0 text-dark"> 
                          {benefit.title}
                        </h5>
                      </div>
                      <Card.Text className="text-secondary mb-3" style={{lineHeight: '1.6'}}> 
                        {benefit.description}
                      </Card.Text>
                      <Badge bg={getTimeframeVariant(benefit.timeframe)} className="px-3 py-2">
                        <i className="fas fa-clock me-1"></i>
                        {benefit.timeframe}
                      </Badge>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          <hr className="my-5" />

          {/* Call to Action */}
          <div className="text-center mb-5 p-4 bg-light rounded">
            <h3 className="text-primary mb-3">💪 Sẵn sàng thay đổi cuộc sống?</h3>
            <p className="mb-3">Hãy bắt đầu hành trình cai thuốc ngay hôm nay và trải nghiệm những lợi ích tuyệt vời!</p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <Link to="/my-progress" className="btn btn-primary btn-lg">
                <i className="fas fa-chart-line me-2"></i>Theo dõi tiến độ
              </Link>
              <Link to="/achievements" className="btn btn-success btn-lg">
                <i className="fas fa-trophy me-2"></i>Xem huy hiệu
              </Link>
              <Link to="/create-post" className="btn btn-outline-primary btn-lg">
                <i className="fas fa-plus me-2"></i>Chia sẻ câu chuyện
              </Link>
            </div>
          </div>

          <hr className="my-4" />

          <h2 className="text-center mb-4 text-primary"> 
            <i className="fas fa-comments me-2"></i>
            Chia sẻ kinh nghiệm cai nghiện thuốc lá
          </h2>

          {loadingPosts ? (
            <div className="d-flex justify-content-center my-4"> 
              <Spinner animation="border" role="status" className="me-2" /> 
              <span className="text-secondary">Đang tải bài viết...</span> 
            </div>
          ) : (
            <Row xs={1} md={2} className="g-4"> 
              {posts.map((post) => (
                <Col key={post.Id}> 
                  <Card className="h-100 shadow-sm hover-shadow transition-all"> 
                    {post.image && (
                      <Card.Img variant="top" src={post.image} alt={post.title} style={{ height: '200px', objectFit: 'cover' }} />
                    )}
                    <Card.Body>
                      <Card.Title className="text-primary">
                        {post.Title}
                      </Card.Title>
                      <Card.Text className="text-secondary">
                        {post.Content}
                      </Card.Text>
                      <Card.Text className="text-muted small">
                        <i className="fas fa-user me-1"></i>
                        Đăng bởi: <strong>{post.Author}</strong> -{" "}
                        <i className="fas fa-calendar me-1"></i>
                        {new Date(post.CreatedAt).toLocaleDateString()}
                      </Card.Text>
                      
                      <hr className="my-3" />
                      <h6 className="mb-3">
                        <i className="fas fa-comments me-2"></i>Bình luận
                      </h6>
                      <CommentsDisplay postId={post.Id} user={user} />
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </main>
    </div>
  );
};

// Component mới để hiển thị và nhập bình luận 
const CommentsDisplay = ({ postId, user }) => {
  const [comments, setComments] = useState([]);
  const [newCommentContent, setNewCommentContent] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/auth/posts/${postId}/comments`);
        setComments(response.data);
        setError("");
      } catch (error) {
        console.error(`Error fetching comments for post ${postId}:`, error);
        setError("Không thể tải bình luận. Vui lòng thử lại sau.");
      } finally {
        setLoadingComments(false);
      }
    };
    fetchComments();
  }, [postId]);

  const handleAddComment = async () => {
    if (!user || !localStorage.getItem("token")) {
      setError("Bạn cần đăng nhập để bình luận.");
      return;
    }
    if (!newCommentContent || newCommentContent.trim() === "") {
      setError("Nội dung bình luận không được để trống.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/auth/posts/${postId}/comments`,
        { content: newCommentContent },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setComments(prevComments => [...prevComments, response.data.comment]);
      setNewCommentContent("");
      setError("");
    } catch (error) {
      console.error("Error adding comment:", error);
      setError(error.response?.data?.message || "Lỗi khi thêm bình luận. Vui lòng thử lại.");
    }
  };

  return (
    <div> 
      {loadingComments ? (
        <div className="d-flex justify-content-center my-2">
          <Spinner animation="border" size="sm" className="me-1" /> 
          <span className="text-secondary">Đang tải bình luận...</span> 
        </div>
      ) : (
        comments.length === 0 ? (
          <p className="text-secondary">Chưa có bình luận nào.</p> 
        ) : (
          <ListGroup style={{ maxHeight: 200, overflowY: 'auto' }} className="border rounded p-1"> 
            {comments.map((comment, index) => (
              <ListGroupItem key={comment.Id || index} className="d-flex align-items-start p-1 border-0 border-bottom-dashed last-child-no-border"> {/* Thay thế ListItem bằng ListGroupItem */}
                <div className="flex-grow-1"> 
                  <strong className="d-block">{comment.Author}</strong> 
                  <span className="d-inline text-dark">{comment.Content}</span> 
                  <small className="d-block text-muted">{new Date(comment.CreatedAt).toLocaleDateString()}</small> 
                </div>
              </ListGroupItem>
            ))}
          </ListGroup>
        )
      )}

      {user && ( // Chỉ hiển thị ô nhập bình luận nếu người dùng đã đăng nhập
        <div className="mt-3"> 
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Thêm bình luận"
            value={newCommentContent}
            onChange={(e) => setNewCommentContent(e.target.value)}
            className={`mb-2 ${error ? 'is-invalid' : ''}`}
          />
          {error && <div className="invalid-feedback">{error}</div>}
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddComment}
          >
            <i className="fas fa-comment-dots me-1"></i> Gửi bình luận
          </Button>
        </div>
      )}
    </div>
  );
};

export default BlogPage;
