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
  const [userProfile, setUserProfile] = useState(null);
  const [accessChecked, setAccessChecked] = useState(false);
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
        setError("Bạn cần đăng nhập để tạo bài đăng.");
        setAccessChecked(true);
        return;
      }

      try {
        // Check user profile first
        const profileResponse = await axios.get("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setUserProfile(profileResponse.data);

        // Check if user has permission to create posts
        if (profileResponse.data.role !== 'memberVip' || !profileResponse.data.isMemberVip) {
          setError("Chỉ thành viên VIP đã mua gói mới có thể tạo bài đăng.");
          setAccessChecked(true);
          return;
        }

        // If access is granted, fetch achievements
        const response = await axios.get("http://localhost:5000/api/auth/badges", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserAchievements(response.data.badges || []);
        setAccessChecked(true);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
        setAccessChecked(true);
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

  // Show loading while checking access
  if (!accessChecked) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Đang kiểm tra quyền truy cập...</span>
        </Spinner>
        <p className="mt-2">Đang kiểm tra quyền truy cập...</p>
      </Container>
    );
  }

  // Show error if no access permission
  if (userProfile && (userProfile.role !== 'memberVip' || !userProfile.isMemberVip)) {
    return (
      <Container className="my-5">
        <div className="card p-4 shadow-sm text-center">
          <h2 className="mb-4 text-danger">
            <i className="fas fa-lock me-2"></i> Không có quyền truy cập
          </h2>
          <BAlert variant="warning">
            <h4>Chỉ thành viên VIP đã mua gói mới có thể tạo bài đăng!</h4>
            <p>Để tạo bài đăng trong cộng đồng, bạn cần:</p>
            <ul className="list-unstyled">
              <li>✓ Nâng cấp tài khoản lên VIP</li>
              <li>✓ Mua gói thành viên</li>
            </ul>
            <Button 
              variant="success" 
              onClick={() => navigate('/subscribe')}
              className="me-2"
            >
              <i className="fas fa-crown me-2"></i>Nâng cấp VIP
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate('/blog')}
            >
              <i className="fas fa-arrow-left me-2"></i>Quay lại cộng đồng
            </Button>
          </BAlert>
        </div>
      </Container>
    );
  }

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