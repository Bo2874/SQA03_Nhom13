import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Alert } from 'antd';
import {
  UserOutlined,
  BookOutlined,
  TeamOutlined,
  VideoCameraOutlined,
  RiseOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import http from '../api/http';

const { Title } = Typography;

interface PlatformStats {
  totalCourses: number;
  totalStudents: number;
  totalTeachers: number;
  totalEpisodes: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats>({
    totalCourses: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalEpisodes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await http.get('/api/v1/courses/stats/platform');
        if (response.data.result) {
          setStats(response.data.result);
        }
      } catch (err: any) {
        console.error('Error fetching stats:', err);
        setError(err.response?.data?.message || 'Không thể tải thống kê');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Lỗi"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px 0' }}
      />
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          📊 Tổng Quan Hệ Thống
        </Title>
        <p style={{ color: '#666', marginTop: 8 }}>
          Thống kê và quản lý nền tảng E-Learning
        </p>
      </div>

      {/* Main Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>Tổng Khóa Học</span>}
              value={stats.totalCourses}
              prefix={<BookOutlined style={{ fontSize: 24 }} />}
              valueStyle={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}
            />
            <div style={{ marginTop: 12, opacity: 0.9, fontSize: 12 }}>
              📚 Đã được phê duyệt và xuất bản
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>Tổng Học Viên</span>}
              value={stats.totalStudents}
              prefix={<TeamOutlined style={{ fontSize: 24 }} />}
              valueStyle={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}
            />
            <div style={{ marginTop: 12, opacity: 0.9, fontSize: 12 }}>
              👨‍🎓 Đang tham gia học tập
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white',
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>Tổng Giáo Viên</span>}
              value={stats.totalTeachers}
              prefix={<UserOutlined style={{ fontSize: 24 }} />}
              valueStyle={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}
            />
            <div style={{ marginTop: 12, opacity: 0.9, fontSize: 12 }}>
              👩‍🏫 Đang hoạt động giảng dạy
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>Tổng Bài Giảng</span>}
              value={stats.totalEpisodes}
              prefix={<VideoCameraOutlined style={{ fontSize: 24 }} />}
              valueStyle={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}
            />
            <div style={{ marginTop: 12, opacity: 0.9, fontSize: 12 }}>
              🎬 Video và tài liệu học tập
            </div>
          </Card>
        </Col>
      </Row>

      {/* Performance Indicators */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12} lg={8}>
          <Card
            title={
              <span>
                <RiseOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                Chỉ Số Hoạt Động
              </span>
            }
            bordered={false}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#666' }}>Tỷ lệ khóa học/giáo viên</span>
                <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                  {stats.totalTeachers > 0
                    ? (stats.totalCourses / stats.totalTeachers).toFixed(2)
                    : 0}
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  background: '#f0f0f0',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min((stats.totalCourses / stats.totalTeachers) * 20, 100)}%`,
                    background: 'linear-gradient(90deg, #1890ff, #36cfc9)',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#666' }}>Tỷ lệ học viên/khóa học</span>
                <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
                  {stats.totalCourses > 0
                    ? (stats.totalStudents / stats.totalCourses).toFixed(2)
                    : 0}
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  background: '#f0f0f0',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min((stats.totalStudents / stats.totalCourses) * 10, 100)}%`,
                    background: 'linear-gradient(90deg, #52c41a, #73d13d)',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#666' }}>Bài giảng/khóa học</span>
                <span style={{ fontWeight: 'bold', color: '#fa8c16' }}>
                  {stats.totalCourses > 0
                    ? (stats.totalEpisodes / stats.totalCourses).toFixed(2)
                    : 0}
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  background: '#f0f0f0',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min((stats.totalEpisodes / stats.totalCourses) * 5, 100)}%`,
                    background: 'linear-gradient(90deg, #fa8c16, #ffa940)',
                  }}
                />
              </div>
            </div>
          </Card>
        </Col>

        {/* <Col xs={24} md={12} lg={8}>
          <Card
            title={
              <span>
                <TrophyOutlined style={{ marginRight: 8, color: '#faad14' }} />
                Thành Tích
              </span>
            }
            bordered={false}
          >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: 16,
                }}
              >
                100+
              </div>
              <div style={{ color: '#666', marginBottom: 24 }}>Tổng Người Dùng & Nội Dung</div>

              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                    {((stats.totalCourses / (stats.totalCourses + 50)) * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>Tăng Trưởng</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                    {((stats.totalStudents / (stats.totalStudents + 100)) * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>Hoạt Động</div>
                </div>
              </div>
            </div>
          </Card>
        </Col> */}

        <Col xs={24} md={24} lg={8}>
          <Card
            title="🎯 Mục Tiêu"
            bordered={false}
            style={{ height: '100%' }}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>100 Khóa Học</span>
                <span style={{ fontWeight: 'bold' }}>
                  {stats.totalCourses}/100
                </span>
              </div>
              <div
                style={{
                  height: 12,
                  background: '#f0f0f0',
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min((stats.totalCourses / 100) * 100, 100)}%`,
                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>500 Học Viên</span>
                <span style={{ fontWeight: 'bold' }}>
                  {stats.totalStudents}/500
                </span>
              </div>
              <div
                style={{
                  height: 12,
                  background: '#f0f0f0',
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min((stats.totalStudents / 500) * 100, 100)}%`,
                    background: 'linear-gradient(90deg, #f093fb, #f5576c)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>50 Giáo Viên</span>
                <span style={{ fontWeight: 'bold' }}>
                  {stats.totalTeachers}/50
                </span>
              </div>
              <div
                style={{
                  height: 12,
                  background: '#f0f0f0',
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min((stats.totalTeachers / 50) * 100, 100)}%`,
                    background: 'linear-gradient(90deg, #fa709a, #fee140)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="⚡ Truy Cập Nhanh" bordered={false}>
            <Row gutter={16}>
              <Col xs={12} sm={6}>
                <Card
                  hoverable
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => window.location.href = '/courses'}
                >
                  <BookOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
                  <div>Quản Lý Khóa Học</div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card
                  hoverable
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => window.location.href = '/teacher-approval'}
                >
                  <UserOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }} />
                  <div>Duyệt Giáo Viên</div>
                </Card>
              </Col>
              {/* <Col xs={12} sm={6}>
                <Card
                  hoverable
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => window.location.href = '/course-approval'}
                >
                  <TrophyOutlined style={{ fontSize: 32, color: '#faad14', marginBottom: 8 }} />
                  <div>Duyệt Khóa Học</div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card
                  hoverable
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => window.location.href = '/exam-approval'}
                >
                  <VideoCameraOutlined style={{ fontSize: 32, color: '#f5222d', marginBottom: 8 }} />
                  <div>Quản Lý Bài Thi</div>
                </Card>
              </Col> */}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
