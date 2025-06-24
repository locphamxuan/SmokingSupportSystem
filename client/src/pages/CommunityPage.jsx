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
} from "react-bootstrap";
import axios from "axios";
import { useLocation, Link } from 'react-router-dom';

const CommunityPage = () => {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState(null);

  const location = useLocation();

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

    if (location.state?.postCreated) {
      setSuccess("Bài đăng đã được tạo thành công!");
      window.history.replaceState({}, document.title);
    }
  }, [fetchPosts, location.state?.postCreated]);

  const handleCloseSnackbar = () => {
    setError("");
    setSuccess("");
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ paddingTop: '80px', backgroundColor: '#f8f9fa' }}>
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

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="text-primary fw-bold mb-1"> 
                <i className="fas fa-comments me-2"></i>
                Cộng Đồng Chia Sẻ
              </h1>
              <p className="lead text-muted">
                Nơi chia sẻ câu chuyện, kinh nghiệm và tạo động lực.
              </p>
            </div>
            <Link to="/create-post" className="btn btn-primary btn-lg">
              <i className="fas fa-plus me-2"></i>Tạo bài viết
            </Link>
          </div>
          
          <hr className="mb-4"/>

          {loadingPosts ? (
            <div className="d-flex justify-content-center my-5 py-5"> 
              <Spinner animation="border" role="status" className="me-2" /> 
              <span className="text-secondary fs-5">Đang tải bài viết...</span> 
            </div>
          ) : (
            <Row xs={1} md={2} className="g-4"> 
              {posts.map((post) => (
                <Col key={post.Id}> 
                  <Card className="h-100 shadow-sm" style={{transition: 'all 0.3s ease', border: 'none'}}> 
                    {post.image && (
                      <Card.Img variant="top" src={post.image} alt={post.title} style={{ height: '200px', objectFit: 'cover' }} />
                    )}
                    <Card.Body className="d-flex flex-column">
                      <Card.Title className="text-primary h5">
                        {post.Title}
                      </Card.Title>
                      <Card.Text className="text-secondary flex-grow-1">
                        {post.Content}
                      </Card.Text>
                      <Card.Text className="text-muted small mt-3">
                        <i className="fas fa-user me-1"></i>
                        Đăng bởi: <strong>{post.Author}</strong> -{" "}
                        <i className="fas fa-calendar me-1"></i>
                        {new Date(post.CreatedAt).toLocaleDateString()}
                      </Card.Text>
                      
                      <hr className="my-3" />
                      <h6 className="mb-3 text-dark">
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
        setError("Không thể tải bình luận.");
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
      setError(error.response?.data?.message || "Lỗi khi thêm bình luận.");
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
          <p className="text-secondary small">Chưa có bình luận nào. Hãy là người đầu tiên!</p> 
        ) : (
          <ListGroup style={{ maxHeight: 200, overflowY: 'auto' }} className="border rounded p-1 mb-2"> 
            {comments.map((comment, index) => (
              <ListGroupItem key={comment.Id || index} className="p-2 border-0 border-bottom">
                <div className="flex-grow-1"> 
                  <strong className="d-block text-dark">{comment.Author}</strong> 
                  <span className="d-inline">{comment.Content}</span> 
                  <small className="d-block text-muted mt-1">{new Date(comment.CreatedAt).toLocaleDateString()}</small> 
                </div>
              </ListGroupItem>
            ))}
          </ListGroup>
        )
      )}

      {user && (
        <div className="mt-2"> 
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Viết bình luận của bạn..."
            value={newCommentContent}
            onChange={(e) => setNewCommentContent(e.target.value)}
            className={`mb-2 ${error ? 'is-invalid' : ''}`}
          />
          {error && <div className="invalid-feedback mb-2">{error}</div>}
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddComment}
          >
            <i className="fas fa-paper-plane me-1"></i> Gửi
          </Button>
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
