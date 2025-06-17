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
  Button
} from "react-bootstrap";

import axios from "axios";
import { useLocation, Link } from 'react-router-dom'; 
import facebookImage from "../assets/images/facebook.jpg";
import instagramImage from "../assets/images/instragram.jpg";


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

  const benefitsData = [
    {
      icon: <i className="fas fa-heart text-danger"></i>, 
      title: "Cải thiện sức khỏe tim mạch",
      description: "Chỉ sau 20 phút ngừng hút thuốc, nhịp tim và huyết áp bắt đầu trở về bình thường"
    },
    {
      icon: <i className="fas fa-brain text-info"></i>, 
      title: "Tăng cường trí nhớ và tập trung",
      description: "Oxy được cung cấp đầy đủ cho não bộ, cải thiện khả năng tư duy và học tập"
    },
    {
      icon: <i className="fas fa-money-bill-wave text-success"></i>, 
      title: "Tiết kiệm tài chính",
      description: "Tiết kiệm hàng triệu đồng mỗi năm từ việc không mua thuốc lá"
    },
    {
      icon: <i className="fas fa-clock text-warning"></i>, 
      title: "Kéo dài tuổi thọ",
      description: "Giảm nguy cơ ung thư phổi lên đến 50% sau 10 năm cai thuốc"
    }
  ];

  const harmfulEffects = [
    "Ung thư phổi, họng, thực quản và nhiều bộ phận khác",
    "Bệnh tim mạch, đột quỵ và các vấn đề về hệ tuần hoàn",
    "Bệnh phổi tắc nghẽn mãn tính (COPD)",
    "Giảm khả năng sinh sản ở cả nam và nữ",
    "Lão hóa da, răng và hôi miệng",
    "Suy giảm hệ miễn dịch, dễ mắc bệnh",
    "Ảnh hưởng xấu đến thai nhi khi mang thai",
    "Gây nghiện nicotine, khó cai bỏ"
  ];

  return (
    <div className="d-flex flex-column min-vh-100"> 
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

          <div className="mb-5"> 
            <h2 className="text-center mb-4 text-primary"> 
              Lợi ích của việc cai nghiện thuốc lá
            </h2>
            <Row xs={1} md={2} className="g-4"> 
              {benefitsData.map((benefit, index) => (
                <Col key={index}> 
                  <Card className="h-100 shadow-sm transition-transform hover-scale"> 
                    <Card.Body> 
                      <div className="d-flex align-items-center mb-2"> 
                        {benefit.icon}
                        <h5 className="ms-2 fw-bold"> 
                          {benefit.title}
                        </h5>
                      </div>
                      <Card.Text className="text-secondary"> 
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          <div className="mb-5"> 
            <h2 className="text-center mb-4 text-danger"> 
            </h2>
            <div className="p-4 bg-warning-subtle rounded shadow-sm"> 
              <div className="d-flex align-items-center mb-3"> 
                <i className="fas fa-exclamation-triangle text-warning me-2 fs-3"></i> 
                <h6 className="text-warning fw-bold"> 
                  Thuốc lá gây ra nhiều tác hại nghiêm trọng đến sức khỏe:
                </h6>
              </div>
              <ListGroup variant="flush"> {/* Thay thế List bằng ListGroup */}
                {harmfulEffects.map((effect, index) => (
                  <ListGroupItem key={index} className="py-1 border-0 bg-transparent"> 
                    <div className="d-flex align-items-center"> 
                      <i className="fas fa-check-circle text-danger me-2"></i> 
                      <span className="text-dark">{effect}</span> 
                    </div>
                  </ListGroupItem>
                ))}
              </ListGroup>
            </div>
          </div>

          <hr className="my-4" /> 

          <h2 className="text-center mb-4 text-primary"> 
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
                  <Card className="h-100 shadow-sm"> 
                    {post.image && (
                      <Card.Img variant="top" src={post.image} alt={post.title} style={{ height: '200px', objectFit: 'cover' }} />
                    )}
                    <Card.Body>
                      <Card.Title>
                        {post.Title}
                      </Card.Title>
                      <Card.Text className="text-secondary">
                        {post.Content}
                      </Card.Text>
                      <Card.Text className="text-muted small">
                        Đăng bởi: {post.Author} -{" "}
                        {new Date(post.CreatedAt).toLocaleDateString()}
                      </Card.Text>
                      
                      <hr className="my-3" />
                      <h6 className="mb-3">Bình luận</h6>
                      <CommentsDisplay postId={post.Id} user={user} />
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </main>
      
      <footer className="footer">
        <div className="container">
          <div className="social-icons">
            <a
              href="https://www.facebook.com/loccphamxuan?locale=vi_VN"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <img
                src={facebookImage}
                alt="Facebook"
                style={{ width: "36px", height: "36px" }}
              />
            </a>
            <a
              href="https://www.instagram.com/xlocpham/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <img
                src={instagramImage}
                alt="Instagram"
                style={{ width: "36px", height: "36px" }}
              />
            </a>
          </div>
          <p className="copyright">
            &copy; 2024 Hỗ trợ cai nghiện. Đã đăng ký bản quyền.
          </p>
        </div>
      </footer>
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
