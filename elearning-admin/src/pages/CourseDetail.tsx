import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Breadcrumb,
  Tabs,
  Typography,
  Image,
  Descriptions,
  Space,
  Button,
  Tag,
  Affix,
  Collapse,
  List,
  Modal,
  message,
  Divider,
  Row,
  Col,
  Statistic,
  Input,
  Badge,
} from 'antd';
import {
  HomeOutlined,
  BookOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  QuestionCircleOutlined,
  UserOutlined,
  SettingOutlined,
  FileTextOutlined,
  EyeOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import coursesAPI from '../api/courses';
import type { Course, Chapter, Episode, Quiz, Question } from '../types';
import { CourseStatus } from '../types';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isQuizModalVisible, setIsQuizModalVisible] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    if (id) {
      fetchCourseData();
    }
  }, [id]);

  const fetchCourseData = async () => {
    if (!id) return;

    setPageLoading(true);
    try {
      const [courseRes, chaptersRes] = await Promise.all([
        coursesAPI.getCourseById(Number(id)),
        coursesAPI.getCourseChapters(Number(id)),
      ]);

      setCourse(courseRes.result);
      setChapters(chaptersRes.result || []);
    } catch (error: any) {
      message.error(error.message || 'Không thể tải thông tin khóa học!');
      navigate('/courses');
    } finally {
      setPageLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!course) return;

    setLoading(true);
    try {
      await coursesAPI.approveCourse(course.id);

      message.success('Đã duyệt khóa học thành công!');
      setTimeout(() => navigate('/courses'), 1500);
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi duyệt khóa học!');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối!');
      return;
    }

    if (!course) return;

    setLoading(true);
    try {
      await coursesAPI.rejectCourse(course.id, rejectionReason);

      message.success('Đã từ chối khóa học!');
      setIsRejectModalVisible(false);
      setRejectionReason('');
      setTimeout(() => navigate('/courses'), 1500);
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi từ chối khóa học!');
    } finally {
      setLoading(false);
    }
  };

  const handleViewQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setIsQuizModalVisible(true);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} phút`;
  };

  const getStatusTag = (status: CourseStatus) => {
    const statusConfig = {
      [CourseStatus.PENDING_REVIEW]: { color: 'orange', text: 'Chờ duyệt' },
      [CourseStatus.APPROVED]: { color: 'green', text: 'Đã duyệt' },
      [CourseStatus.REJECTED]: { color: 'red', text: 'Từ chối' },
      [CourseStatus.PUBLISHED]: { color: 'blue', text: 'Đã xuất bản' },
      [CourseStatus.DRAFT]: { color: 'default', text: 'Nháp' },
    };
    return (
      <Tag color={statusConfig[status].color}>
        {statusConfig[status].text}
      </Tag>
    );
  };

  if (pageLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Title level={3}>Đang tải thông tin khóa học...</Title>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <FileTextOutlined /> Tổng Quan
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Course Thumbnail */}
          {course.thumbnailUrl && (
            <Card>
              <Image
                src={course.thumbnailUrl}
                alt={course.title}
                style={{ width: '100%', maxHeight: 400, objectFit: 'cover' }}
              />
            </Card>
          )}

          {/* Course Statistics */}
          <Card title="Thống kê khóa học">
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title="Chương"
                  value={course.chapterCount || 0}
                  prefix={<BookOutlined />}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title="Bài học"
                  value={course.episodeCount || 0}
                  prefix={<PlayCircleOutlined />}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title="Học viên"
                  value={course.enrollmentCount || 0}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title="Trạng thái"
                  value={getStatusTag(course.status)}
                  valueRender={() => getStatusTag(course.status)}
                />
              </Col>
            </Row>
          </Card>

          {/* Course Details */}
          <Card title="Thông tin chi tiết">
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Tiêu đề">
                {course.title}
              </Descriptions.Item>
              <Descriptions.Item label="Môn học">
                {course.subject?.name || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Khối lớp">
                {course.gradeLevel?.name || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {dayjs(course.createdAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              {course.submittedAt && (
                <Descriptions.Item label="Ngày nộp duyệt">
                  {dayjs(course.submittedAt).format('DD/MM/YYYY HH:mm')}
                </Descriptions.Item>
              )}
              {course.approvedAt && (
                <Descriptions.Item label="Ngày duyệt">
                  {dayjs(course.approvedAt).format('DD/MM/YYYY HH:mm')}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Course Description */}
          <Card title="Mô tả khóa học">
            <Paragraph>
              {course.summary || 'Chưa có mô tả cho khóa học này.'}
            </Paragraph>
          </Card>

          {/* Rejection Reason */}
          {course.status === CourseStatus.REJECTED && course.rejectionReason && (
            <Card title="Lý do từ chối" style={{ borderColor: '#ff4d4f' }}>
              <Text type="danger">{course.rejectionReason}</Text>
            </Card>
          )}
        </Space>
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <BookOutlined /> Nội Dung Khóa Học
        </span>
      ),
      children: (
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={4}>
                Danh sách chương ({chapters.length} chương)
              </Title>
              <Text type="secondary">
                Tổng số bài học: {course.episodeCount || 0}
              </Text>
            </div>
          </Space>

          <Collapse>
            {chapters.map((chapter, chapterIndex) => (
              <Panel
                key={chapter.id}
                header={
                  <Space>
                    <Badge count={chapterIndex + 1} style={{ backgroundColor: '#1890ff' }} />
                    <Text strong>{chapter.title}</Text>
                    <Tag color="blue">{chapter.episodes?.length || 0} bài học</Tag>
                  </Space>
                }
                extra={
                  <Text type="secondary">{chapter.description}</Text>
                }
              >
                {chapter.episodes && chapter.episodes.length > 0 ? (
                  <List
                    dataSource={chapter.episodes}
                    renderItem={(episode: Episode, episodeIndex) => (
                      <List.Item
                        actions={[
                          episode.videoUrl && (
                            <Button
                              icon={<PlayCircleOutlined />}
                              size="small"
                              type="link"
                              onClick={() => window.open(episode.videoUrl, '_blank')}
                            >
                              Xem video
                            </Button>
                          ),
                        ].filter(Boolean)}
                      >
                        <List.Item.Meta
                          avatar={
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                backgroundColor: '#f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                              }}
                            >
                              {episodeIndex + 1}
                            </div>
                          }
                          title={<Text strong>{episode.title}</Text>}
                          description={
                            <Space split={<Divider type="vertical" />}>
                              <Text type="secondary">{episode.description}</Text>
                              {episode.durationSeconds && (
                                <Text type="secondary">
                                  <ClockCircleOutlined /> {formatDuration(episode.durationSeconds)}
                                </Text>
                              )}
                              {episode.quizQuestions && episode.quizQuestions.length > 0 && (
                                <Tag color="orange">
                                  {episode.quizQuestions.length} câu hỏi
                                </Tag>
                              )}
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Text type="secondary">Chương này chưa có bài học nào.</Text>
                )}
              </Panel>
            ))}
          </Collapse>

          {chapters.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Text type="secondary">Khóa học chưa có nội dung.</Text>
            </div>
          )}
        </Card>
      ),
    },
    {
      key: '3',
      label: (
        <span>
          <UserOutlined /> Thông Tin Giáo Viên
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Teacher Profile */}
          {course.teacher && (
            <Card>
              <Space direction="horizontal" size="large" align="start">
                {course.teacher.avatarUrl ? (
                  <Image
                    src={course.teacher.avatarUrl}
                    alt={course.teacher.fullName}
                    width={120}
                    height={120}
                    style={{ borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      backgroundColor: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 48,
                    }}
                  >
                    <UserOutlined />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <Title level={4}>{course.teacher.fullName}</Title>
                  <Space direction="vertical" size="small">
                    <Text type="secondary">Email: {course.teacher.email}</Text>
                    {course.teacher.phone && (
                      <Text type="secondary">SĐT: {course.teacher.phone}</Text>
                    )}
                    <Tag color="blue">{course.teacher.role}</Tag>
                  </Space>
                </div>
              </Space>
            </Card>
          )}

          {/* Teacher Statistics */}
          <Card title="Thống kê giáo viên">
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8}>
                <Statistic
                  title="Khóa học"
                  value={mockCourses.filter((c) => c.teacherId === course.teacherId).length}
                  prefix={<BookOutlined />}
                />
              </Col>
              <Col xs={12} sm={8}>
                <Statistic
                  title="Ngày tham gia"
                  value={course.teacher ? dayjs(course.teacher.createdAt).format('DD/MM/YYYY') : 'N/A'}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col xs={12} sm={8}>
                <Statistic
                  title="Trạng thái"
                  value={course.teacher?.status || 'N/A'}
                  valueRender={() => (
                    <Tag color="green">{course.teacher?.status || 'N/A'}</Tag>
                  )}
                />
              </Col>
            </Row>
          </Card>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Breadcrumb */}
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item
          onClick={() => navigate('/courses')}
          style={{ cursor: 'pointer' }}
        >
          <BookOutlined /> Duyệt Khóa Học
        </Breadcrumb.Item>
        <Breadcrumb.Item>{course.title}</Breadcrumb.Item>
      </Breadcrumb>

      {/* Page Header */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space>
            <Title level={2} style={{ margin: 0 }}>
              {course.title}
            </Title>
            {getStatusTag(course.status)}
          </Space>
          <Text type="secondary">ID: {course.id}</Text>
        </Space>
      </Card>

      {/* Main Content */}
      <Tabs items={tabItems} defaultActiveKey="1" />

      {/* Sticky Action Buttons */}
      {course.status === CourseStatus.PENDING_REVIEW && (
        <Affix offsetBottom={20}>
          <Card style={{ boxShadow: '0 -2px 8px rgba(0,0,0,0.15)' }}>
            <Space size="middle">
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                size="large"
                onClick={handleApprove}
                loading={loading}
              >
                Duyệt Khóa Học
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                size="large"
                onClick={() => setIsRejectModalVisible(true)}
                disabled={loading}
              >
                Từ Chối
              </Button>
              <Button
                size="large"
                onClick={() => navigate('/courses')}
              >
                Quay Lại
              </Button>
            </Space>
          </Card>
        </Affix>
      )}

      {/* Reject Modal */}
      <Modal
        title="Từ chối khóa học"
        open={isRejectModalVisible}
        onOk={handleRejectSubmit}
        onCancel={() => {
          setIsRejectModalVisible(false);
          setRejectionReason('');
        }}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true, loading }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text>Vui lòng nhập lý do từ chối khóa học này:</Text>
          <TextArea
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Nhập lý do từ chối (bắt buộc)"
            maxLength={500}
            showCount
          />
        </Space>
      </Modal>

      {/* Quiz Preview Modal */}
      <Modal
        title={
          <Space>
            <QuestionCircleOutlined />
            {selectedQuiz?.title}
          </Space>
        }
        open={isQuizModalVisible}
        onCancel={() => {
          setIsQuizModalVisible(false);
          setSelectedQuiz(null);
        }}
        footer={null}
        width={800}
      >
        {selectedQuiz && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {selectedQuiz.description && (
              <Text type="secondary">{selectedQuiz.description}</Text>
            )}
            <Divider />
            <List
              dataSource={selectedQuiz.questions}
              renderItem={(question: Question, index) => (
                <Card
                  key={question.id}
                  style={{ marginBottom: 16 }}
                  title={
                    <Space>
                      <Text strong>Câu {index + 1}:</Text>
                      <Tag color="blue">{question.points} điểm</Tag>
                    </Space>
                  }
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Text>{question.content}</Text>
                    <List
                      dataSource={question.answers}
                      renderItem={(answer) => (
                        <List.Item
                          style={{
                            backgroundColor: answer.isCorrect ? '#f6ffed' : 'transparent',
                            border: answer.isCorrect ? '1px solid #b7eb8f' : 'none',
                            borderRadius: 4,
                            padding: '8px 12px',
                          }}
                        >
                          <Space>
                            {answer.isCorrect && (
                              <CheckCircleOutlined style={{ color: '#52c41a' }} />
                            )}
                            <Text strong={answer.isCorrect}>{answer.content}</Text>
                          </Space>
                        </List.Item>
                      )}
                    />
                    {question.explanation && (
                      <div
                        style={{
                          backgroundColor: '#e6f7ff',
                          padding: 12,
                          borderRadius: 4,
                          borderLeft: '3px solid #1890ff',
                        }}
                      >
                        <Space direction="vertical" size="small">
                          <Text strong>Giải thích:</Text>
                          <Text>{question.explanation}</Text>
                        </Space>
                      </div>
                    )}
                  </Space>
                </Card>
              )}
            />
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default CourseDetail;
