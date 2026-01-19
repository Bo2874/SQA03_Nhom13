import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Breadcrumb,
  Tabs,
  Typography,
  Descriptions,
  Space,
  Button,
  Tag,
  Affix,
  List,
  Modal,
  message,
  Divider,
  Row,
  Col,
  Statistic,
  Input,
  Alert,
  Select,
  Switch,
} from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  UserOutlined,
  SettingOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  FileProtectOutlined,
  TrophyOutlined,
  EyeOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { mockExams, mockExamQuestions } from '../data/mockData';
import type { Exam, Question, Answer } from '../types';
import { ExamStatus, QuestionType } from '../types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ExamDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [questionFilter, setQuestionFilter] = useState<'all' | QuestionType>('all');

  useEffect(() => {
    // Load exam data
    const examData = mockExams.find((e) => e.id === Number(id));
    if (examData) {
      setExam(examData);
      // Load questions for this exam
      const examQuestions = mockExamQuestions[examData.id] || [];
      setQuestions(examQuestions);
    } else {
      message.error('Không tìm thấy bài kiểm tra!');
      navigate('/exams');
    }
  }, [id, navigate]);

  const handleApprove = async () => {
    if (!exam) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update exam status
      const updatedExam = {
        ...exam,
        status: ExamStatus.APPROVED,
        approvedAt: new Date().toISOString(),
      };
      setExam(updatedExam);

      // Update in mock data
      const examIndex = mockExams.findIndex((e) => e.id === exam.id);
      if (examIndex !== -1) {
        mockExams[examIndex] = updatedExam;
      }

      message.success('Đã duyệt bài kiểm tra thành công!');
      setTimeout(() => navigate('/exams'), 1500);
    } catch (error) {
      message.error('Có lỗi xảy ra khi duyệt bài kiểm tra!');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối!');
      return;
    }

    if (!exam) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update exam status
      const updatedExam = {
        ...exam,
        status: ExamStatus.CLOSED,
        rejectionReason,
      };
      setExam(updatedExam);

      // Update in mock data
      const examIndex = mockExams.findIndex((e) => e.id === exam.id);
      if (examIndex !== -1) {
        mockExams[examIndex] = updatedExam;
      }

      message.success('Đã từ chối bài kiểm tra!');
      setIsRejectModalVisible(false);
      setRejectionReason('');
      setTimeout(() => navigate('/exams'), 1500);
    } catch (error) {
      message.error('Có lỗi xảy ra khi từ chối bài kiểm tra!');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: ExamStatus) => {
    const statusConfig = {
      [ExamStatus.PENDING_REVIEW]: { color: 'orange', text: 'Chờ duyệt' },
      [ExamStatus.APPROVED]: { color: 'green', text: 'Đã duyệt' },
      [ExamStatus.LIVE]: { color: 'blue', text: 'Đang diễn ra' },
      [ExamStatus.CLOSED]: { color: 'default', text: 'Đã đóng' },
      [ExamStatus.DRAFT]: { color: 'default', text: 'Nháp' },
    };
    return (
      <Tag color={statusConfig[status].color}>
        {statusConfig[status].text}
      </Tag>
    );
  };

  const getQuestionTypeText = (type: QuestionType) => {
    const typeMap = {
      [QuestionType.MULTIPLE_CHOICE]: 'Trắc nghiệm',
      [QuestionType.TRUE_FALSE]: 'Đúng/Sai',
      [QuestionType.SHORT_ANSWER]: 'Tự luận ngắn',
    };
    return typeMap[type];
  };

  const getQuestionTypeColor = (type: QuestionType) => {
    const colorMap = {
      [QuestionType.MULTIPLE_CHOICE]: 'blue',
      [QuestionType.TRUE_FALSE]: 'green',
      [QuestionType.SHORT_ANSWER]: 'orange',
    };
    return colorMap[type];
  };

  const filteredQuestions = questionFilter === 'all'
    ? questions
    : questions.filter(q => q.type === questionFilter);

  if (!exam) {
    return <div>Đang tải...</div>;
  }

  const timeUntilStart = dayjs(exam.startTime).diff(dayjs(), 'day');
  const duration = dayjs(exam.endTime).diff(dayjs(exam.startTime), 'minute');
  const isUpcoming = dayjs().isBefore(dayjs(exam.startTime));
  const isOngoing = dayjs().isAfter(dayjs(exam.startTime)) && dayjs().isBefore(dayjs(exam.endTime));
  const isEnded = dayjs().isAfter(dayjs(exam.endTime));

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
          {/* Exam Status Alert */}
          {isUpcoming && (
            <Alert
              message="Bài kiểm tra sắp diễn ra"
              description={`Bài kiểm tra sẽ bắt đầu trong ${timeUntilStart} ngày`}
              type="info"
              showIcon
              icon={<CalendarOutlined />}
            />
          )}
          {isOngoing && (
            <Alert
              message="Bài kiểm tra đang diễn ra"
              description="Sinh viên có thể làm bài kiểm tra này"
              type="success"
              showIcon
            />
          )}
          {isEnded && (
            <Alert
              message="Bài kiểm tra đã kết thúc"
              description="Không còn sinh viên nào có thể làm bài"
              type="warning"
              showIcon
            />
          )}

          {/* Exam Schedule */}
          <Card title="Lịch thi">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Card>
                  <Statistic
                    title="Thời gian bắt đầu"
                    value={dayjs(exam.startTime).format('DD/MM/YYYY HH:mm')}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ fontSize: 16 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card>
                  <Statistic
                    title="Thời gian kết thúc"
                    value={dayjs(exam.endTime).format('DD/MM/YYYY HH:mm')}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ fontSize: 16 }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>

          {/* Exam Statistics */}
          <Card title="Thông tin bài thi">
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title="Thời lượng"
                  value={exam.durationMinutes}
                  suffix="phút"
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title="Số câu hỏi"
                  value={exam.questionCount || 0}
                  prefix={<QuestionCircleOutlined />}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title="Lượt thi"
                  value={exam.attemptCount || 0}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title="Trạng thái"
                  value={getStatusTag(exam.status)}
                  valueRender={() => getStatusTag(exam.status)}
                />
              </Col>
            </Row>
          </Card>

          {/* Exam Details */}
          <Card title="Chi tiết">
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Tiêu đề">
                {exam.title}
              </Descriptions.Item>
              <Descriptions.Item label="Giáo viên">
                {exam.teacher?.fullName || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {dayjs(exam.createdAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              {exam.submittedAt && (
                <Descriptions.Item label="Ngày nộp duyệt">
                  {dayjs(exam.submittedAt).format('DD/MM/YYYY HH:mm')}
                </Descriptions.Item>
              )}
              {exam.approvedAt && (
                <Descriptions.Item label="Ngày duyệt">
                  {dayjs(exam.approvedAt).format('DD/MM/YYYY HH:mm')}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Rejection Reason */}
          {exam.rejectionReason && (
            <Card title="Lý do từ chối" style={{ borderColor: '#ff4d4f' }}>
              <Text type="danger">{exam.rejectionReason}</Text>
            </Card>
          )}
        </Space>
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <QuestionCircleOutlined /> Câu Hỏi ({questions.length})
        </span>
      ),
      children: (
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={4}>
                Danh sách câu hỏi
              </Title>
              <Space>
                <Text type="secondary">Lọc theo loại:</Text>
                <Select
                  value={questionFilter}
                  onChange={setQuestionFilter}
                  style={{ width: 180 }}
                >
                  <Option value="all">Tất cả ({questions.length})</Option>
                  <Option value={QuestionType.MULTIPLE_CHOICE}>
                    Trắc nghiệm ({questions.filter(q => q.type === QuestionType.MULTIPLE_CHOICE).length})
                  </Option>
                  <Option value={QuestionType.TRUE_FALSE}>
                    Đúng/Sai ({questions.filter(q => q.type === QuestionType.TRUE_FALSE).length})
                  </Option>
                  <Option value={QuestionType.SHORT_ANSWER}>
                    Tự luận ({questions.filter(q => q.type === QuestionType.SHORT_ANSWER).length})
                  </Option>
                </Select>
              </Space>
            </div>
          </Space>

          {filteredQuestions.length > 0 ? (
            <List
              dataSource={filteredQuestions}
              renderItem={(question: Question, index) => (
                <Card
                  key={question.id}
                  style={{ marginBottom: 16 }}
                  title={
                    <Space>
                      <Text strong>Câu {question.orderIndex || index + 1}:</Text>
                      <Tag color={getQuestionTypeColor(question.type)}>
                        {getQuestionTypeText(question.type)}
                      </Tag>
                      <Tag color="blue">{question.points} điểm</Tag>
                    </Space>
                  }
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Text style={{ fontSize: 16 }}>{question.content}</Text>

                    {/* Answers */}
                    {question.answers && question.answers.length > 0 && (
                      <List
                        dataSource={question.answers}
                        renderItem={(answer: Answer) => (
                          <List.Item
                            style={{
                              backgroundColor: answer.isCorrect ? '#f6ffed' : 'transparent',
                              border: answer.isCorrect ? '2px solid #52c41a' : '1px solid #f0f0f0',
                              borderRadius: 4,
                              padding: '12px 16px',
                              marginBottom: 8,
                            }}
                          >
                            <Space>
                              {answer.isCorrect && (
                                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                              )}
                              <Text strong={answer.isCorrect} style={{ fontSize: 15 }}>
                                {String.fromCharCode(65 + answer.orderIndex - 1)}. {answer.content}
                              </Text>
                            </Space>
                          </List.Item>
                        )}
                      />
                    )}

                    {/* Explanation */}
                    {question.explanation && (
                      <Alert
                        message="Giải thích"
                        description={question.explanation}
                        type="info"
                        showIcon
                      />
                    )}
                  </Space>
                </Card>
              )}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Text type="secondary">Không có câu hỏi nào.</Text>
            </div>
          )}
        </Card>
      ),
    },
    {
      key: '3',
      label: (
        <span>
          <SettingOutlined /> Cài Đặt
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Basic Settings */}
          <Card title="Cài đặt cơ bản">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Thời lượng thi:</Text>
                  <div style={{ marginTop: 8 }}>
                    <Text>{exam.durationMinutes} phút</Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Text strong>Tổng số câu hỏi:</Text>
                  <div style={{ marginTop: 8 }}>
                    <Text>{exam.questionCount || 0} câu</Text>
                  </div>
                </Col>
              </Row>
              <Divider />
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Điểm tối đa:</Text>
                  <div style={{ marginTop: 8 }}>
                    <Text>
                      {questions.reduce((sum, q) => sum + q.points, 0)} điểm
                    </Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Text strong>Điểm trung bình/câu:</Text>
                  <div style={{ marginTop: 8 }}>
                    <Text>
                      {questions.length > 0
                        ? (questions.reduce((sum, q) => sum + q.points, 0) / questions.length).toFixed(1)
                        : 0}{' '}
                      điểm
                    </Text>
                  </div>
                </Col>
              </Row>
            </Space>
          </Card>

          {/* Advanced Settings (Read-only for admin) */}
          <Card title="Cài đặt nâng cao">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Space>
                    <Switch checked disabled />
                    <Text>Xáo trộn câu hỏi</Text>
                  </Space>
                  <Paragraph type="secondary" style={{ marginTop: 4, marginLeft: 28 }}>
                    Câu hỏi sẽ được xáo trộn thứ tự cho mỗi học sinh
                  </Paragraph>
                </Col>
                <Col span={24}>
                  <Space>
                    <Switch checked disabled />
                    <Text>Xáo trộn đáp án</Text>
                  </Space>
                  <Paragraph type="secondary" style={{ marginTop: 4, marginLeft: 28 }}>
                    Đáp án sẽ được xáo trộn vị trí
                  </Paragraph>
                </Col>
                <Col span={24}>
                  <Space>
                    <Switch checked={false} disabled />
                    <Text>Cho phép xem lại đáp án</Text>
                  </Space>
                  <Paragraph type="secondary" style={{ marginTop: 4, marginLeft: 28 }}>
                    Học sinh có thể xem lại đáp án đúng sau khi nộp bài
                  </Paragraph>
                </Col>
                <Col span={24}>
                  <Space>
                    <Switch checked disabled />
                    <Text>Chế độ chống gian lận</Text>
                  </Space>
                  <Paragraph type="secondary" style={{ marginTop: 4, marginLeft: 28 }}>
                    Chặn切换 tab, copy/paste, và các hành động đáng ngờ khác
                  </Paragraph>
                </Col>
              </Row>
            </Space>
          </Card>

          {/* Security Settings */}
          <Card title={<Space><FileProtectOutlined /> Bảo mật</Space>}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Space>
                    <Switch checked disabled />
                    <Text>Chặn chuyển tab</Text>
                  </Space>
                </Col>
                <Col span={24}>
                  <Space>
                    <Switch checked disabled />
                    <Text>Chặn chuột phải</Text>
                  </Space>
                </Col>
                <Col span={24}>
                  <Space>
                    <Switch checked={false} disabled />
                    <Text>Yêu cầu camera</Text>
                  </Space>
                </Col>
                <Col span={24}>
                  <Space>
                    <Switch checked disabled />
                    <Text>Ghi log hành vi</Text>
                  </Space>
                </Col>
              </Row>
            </Space>
          </Card>
        </Space>
      ),
    },
    {
      key: '4',
      label: (
        <span>
          <BarChartOutlined /> Kết Quả
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Overall Statistics */}
          <Card title="Thống kê chung">
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Lượt thi"
                  value={exam.attemptCount || 0}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Điểm trung bình"
                  value={0}
                  suffix="/ 10"
                  precision={2}
                  prefix={<TrophyOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Tỷ lệ đạt"
                  value={0}
                  suffix="%"
                  precision={1}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Điểm cao nhất"
                  value={0}
                  suffix="/ 10"
                  precision={2}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
            </Row>
          </Card>

          {/* Score Distribution (Placeholder) */}
          <Card title="Phân bố điểm">
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <BarChartOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
              <Paragraph type="secondary" style={{ marginTop: 16 }}>
                Chưa có dữ liệu thống kê. Biểu đồ sẽ hiển thị khi có học sinh làm bài.
              </Paragraph>
            </div>
          </Card>

          {/* Top Students (Placeholder) */}
          <Card title={<Space><TrophyOutlined /> Bảng xếp hạng</Space>}>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Text type="secondary">
                Chưa có học sinh nào hoàn thành bài kiểm tra
              </Text>
            </div>
          </Card>
        </Space>
      ),
    },
    {
      key: '5',
      label: (
        <span>
          <UserOutlined /> Giáo Viên
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Teacher Profile */}
          {exam.teacher && (
            <Card>
              <Space direction="horizontal" size="large" align="start">
                {exam.teacher.avatarUrl ? (
                  <img
                    src={exam.teacher.avatarUrl}
                    alt={exam.teacher.fullName}
                    style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover' }}
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
                  <Title level={4}>{exam.teacher.fullName}</Title>
                  <Space direction="vertical" size="small">
                    <Text type="secondary">Email: {exam.teacher.email}</Text>
                    {exam.teacher.phone && (
                      <Text type="secondary">SĐT: {exam.teacher.phone}</Text>
                    )}
                    <Tag color="blue">{exam.teacher.role}</Tag>
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
                  title="Bài kiểm tra"
                  value={mockExams.filter((e) => e.teacherId === exam.teacherId).length}
                  prefix={<FileTextOutlined />}
                />
              </Col>
              <Col xs={12} sm={8}>
                <Statistic
                  title="Ngày tham gia"
                  value={exam.teacher ? dayjs(exam.teacher.createdAt).format('DD/MM/YYYY') : 'N/A'}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col xs={12} sm={8}>
                <Statistic
                  title="Trạng thái"
                  value={exam.teacher?.status || 'N/A'}
                  valueRender={() => (
                    <Tag color="green">{exam.teacher?.status || 'N/A'}</Tag>
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
          onClick={() => navigate('/exams')}
          style={{ cursor: 'pointer' }}
        >
          <FileTextOutlined /> Duyệt Bài Kiểm Tra
        </Breadcrumb.Item>
        <Breadcrumb.Item>{exam.title}</Breadcrumb.Item>
      </Breadcrumb>

      {/* Page Header */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space>
            <Title level={2} style={{ margin: 0 }}>
              {exam.title}
            </Title>
            {getStatusTag(exam.status)}
          </Space>
          <Text type="secondary">ID: {exam.id}</Text>
        </Space>
      </Card>

      {/* Main Content */}
      <Tabs items={tabItems} defaultActiveKey="1" />

      {/* Sticky Action Buttons */}
      {exam.status === ExamStatus.PENDING_REVIEW && (
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
                Duyệt Bài Kiểm Tra
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
                onClick={() => navigate('/exams')}
              >
                Quay Lại
              </Button>
            </Space>
          </Card>
        </Affix>
      )}

      {/* Reject Modal */}
      <Modal
        title="Từ chối bài kiểm tra"
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
          <Text>Vui lòng nhập lý do từ chối bài kiểm tra này:</Text>
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
    </div>
  );
};

export default ExamDetail;
