import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Button,
  Form,
  Alert as BAlert,
  Spinner,
} from "react-bootstrap";

const CreatePostPage = () => {
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [creatingPost, setCreatingPost] = useState(false);
  const [userAchievements, setUserAchievements] = useState([]);
  const [selectedAchievement, setSelectedAchievement] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr && userStr !== 'undefined') {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      // Nếu là admin, chuyển hướng ngay
      if (parsedUser.role === 'admin') {
        navigate('/blog');
        return; // Dừng thực thi useEffect
      }
    } else {
      // Nếu chưa đăng nhập, chuyển về trang login
      navigate('/login');
      return; // Dừng thực thi useEffect
    }

    const fetchUserAchievements = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Bạn cần đăng nhập để xem thành tích.");
        return;
      }
      try {
        const response = await axios.get("http://localhost:5000/api/auth/badges", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserAchievements(response.data.badges || []);
      } catch (error) {
        console.error("Error fetching user achievements:", error);
        setError("Không thể tải thành tích. Vui lòng thử lại sau.");
      }
    };
    fetchUserAchievements();
  }, [navigate]);

  const handleAchievementSelect = (event) => {
    const achievementId = event.target.value;
    setSelectedAchievement(achievementId);
    if (achievementId) {
      const achievement = userAchievements.find(a => a.Id === achievementId);
      if (achievement) {
        setNewPostTitle(`Tôi vừa đạt được thành tích: ${achievement.Name}!`);
        setNewPostContent(
          `🎉 Thành tích mới: ${achievement.Name}\n` +
          `Mô tả: ${achievement.Description}\n` +
          `Đạt được vào: ${new Date(achievement.AwardedAt).toLocaleDateString()}\n` +
          `Hãy cùng chúc mừng tôi nhé!`
        );
      }
    } else {
      setNewPostTitle("");
      setNewPostContent("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.id) {
      setError("Bạn cần đăng nhập để tạo bài viết.");
      return;
    }
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      setError("Tiêu đề và nội dung bài viết không được để trống.");
      return;
    }

    setCreatingPost(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/auth/posts",
        { title: newPostTitle, content: newPostContent },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess(response.data.message || "Bài đăng đã được tạo thành công!");
      setNewPostTitle("");
      setNewPostContent("");
      setSelectedAchievement("");
      // Navigate back to the blog page after successful post
      navigate("/blog", { state: { postCreated: true } });
    } catch (err) {
      console.error("Error creating post:", err);
      setError(err.response?.data?.message || "Lỗi khi tạo bài đăng. Vui lòng thử lại.");
    } finally {
      setCreatingPost(false);
    }
  };

  return (
    <Container className="my-5">
      <div className="card p-4 shadow-sm">
        <h2 className="mb-4 text-success">
          <i className="fas fa-plus-square me-2"></i> Tạo bài đăng mới
        </h2>

        {error && <BAlert variant="danger">{error}</BAlert>}
        {success && <BAlert variant="success">{success}</BAlert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Chia sẻ thành tích của bạn</Form.Label>
            <Form.Select
              value={selectedAchievement}
              onChange={handleAchievementSelect}
            >
              <option value="">Không chọn thành tích</option>
              {userAchievements.map((achievement) => (
                <option key={achievement.Id} value={achievement.Id}>
                  {achievement.Name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Tiêu đề bài viết</Form.Label>
            <Form.Control
              type="text"
              placeholder="Nhập tiêu đề bài viết"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Nội dung bài viết</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              placeholder="Nhập nội dung bài viết"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              required
            />
          </Form.Group>

          <Button variant="success" type="submit" disabled={creatingPost}>
            {creatingPost ? (
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-1"
              />
            ) : (
              <i className="fas fa-paper-plane me-2"></i>
            )}
            {creatingPost ? "Đang tạo..." : "Đăng bài"
            }
          </Button>
        </Form>
      </div>
    </Container>
  );
};

export default CreatePostPage; 