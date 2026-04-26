import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Image,
  Descriptions,
  Input,
  message,
  Typography,
  Avatar,
  Row,
  Col,
  Statistic,
  Select,
  Dropdown,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  BookOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  DownOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Course, CourseStatus } from '../types';
import coursesAPI from '../api/courses';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

const CourseApproval: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Course[]>([]);
  const [filteredData, setFilteredData] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'ALL'>('ALL');

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  // Filter courses when data or filter changes
  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFilteredData(data);
    } else {
      setFilteredData(data.filter(course => course.status === statusFilter));
    }
  }, [data, statusFilter]);

  const fetchCourses = async () => {
    setTableLoading(true);
    try {
      const response = await coursesAPI.getCourses();

      // Handle response structure properly
      let courses: Course[] = [];
      if (response.result && Array.isArray(response.result.courses)) {
        courses = response.result.courses;
      } else if (Array.isArray(response.result)) {
        courses = response.result;
      } else if (response.result && Array.isArray(response.result.data)) {
        courses = response.result.data;
      }

      setData(courses);
    } catch (error: any) {
      message.error(error.message || 'Không thể tải danh sách khóa học!');
      setData([]);
    } finally {
      setTableLoading(false);
    }
  };

  // const handleView = (record: Course) => {
  //   navigate(`/courses/${record.id}`);
  // };

  const handleUpdateStatus = async (courseId: number, courseTitle: string, newStatus: CourseStatus) => {
    // If status is REJECTED, show modal to get rejection reason
    if (newStatus === CourseStatus.REJECTED) {
      const course = data.find(c => c.id === courseId);
      if (course) {
        setSelectedCourse(course);
        setRejectionReason('');
        setRejectVisible(true);
      }
      return;
    }

    setLoading(true);
    try {
      await coursesAPI.updateCourseByAdmin(courseId, { status: newStatus });

      // Refresh the list
      await fetchCourses();

      const statusText = {
        [CourseStatus.PENDING_REVIEW]: 'chuyển về Chờ duyệt',
        [CourseStatus.APPROVED]: 'duyệt',
        [CourseStatus.PUBLISHED]: 'xuất bản',
      }[newStatus] || 'cập nhật';

      message.success(`Đã ${statusText} khóa học "${courseTitle}"`);
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi cập nhật khóa học!');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối!');
      return;
    }

    if (!selectedCourse) return;

    setLoading(true);
    try {
      await coursesAPI.rejectCourse(selectedCourse.id, rejectionReason);

      // Refresh the list
      await fetchCourses();

      message.success(`Đã từ chối khóa học "${selectedCourse.title}"`);
      setRejectVisible(false);
      setRejectionReason('');
      setSelectedCourse(null);
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi từ chối khóa học!');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<Course> = [
    {
      title: 'STT',
      key: 'index',
      width: 70,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Khóa Học',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <Space>
          {record.thumbnailUrl ? (
            <Avatar
              shape="square"
              size={48}
              src={record.thumbnailUrl}
            />
          ) : (
            <Avatar shape="square" size={48} icon={<BookOutlined />} />
          )}
          <div>
            <div style={{ fontWeight: 500 }}>{title}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              {record.subject?.name} - {record.gradeLevel?.name}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Giáo Viên',
      dataIndex: ['teacher', 'fullName'],
      key: 'teacher',
    },
    {
      title: 'Nội Dung',
      key: 'content',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <div>{record.chapterCount || 0} chương</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {record.totalEpisodes || 0} bài học
          </div>
        </Space>
      ),
    },
    {
      title: 'Ngày Nộp',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-'),
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: CourseStatus) => {
        const config = {
          [CourseStatus.DRAFT]: { color: 'default', text: 'Nháp' },
          [CourseStatus.PENDING_REVIEW]: { color: 'gold', text: 'Chờ duyệt' },
          [CourseStatus.APPROVED]: { color: 'green', text: 'Đã duyệt' },
          [CourseStatus.REJECTED]: { color: 'red', text: 'Từ chối' },
          [CourseStatus.PUBLISHED]: { color: 'blue', text: 'Đã xuất bản' },
        };
        return <Tag color={config[status].color}>{config[status].text}</Tag>;
      },
    },
    {
      title: 'Thao Tác',
      key: 'action',
      render: (_, record) => {
        const statusMenuItems: MenuProps['items'] = [
          {
            key: CourseStatus.PENDING_REVIEW,
            label: 'Chờ duyệt',
            disabled: record.status === CourseStatus.PENDING_REVIEW,
            onClick: () => handleUpdateStatus(record.id, record.title, CourseStatus.PENDING_REVIEW),
          },
          {
            key: CourseStatus.APPROVED,
            label: 'Duyệt',
            icon: <CheckCircleOutlined />,
            disabled: record.status === CourseStatus.APPROVED,
            onClick: () => handleUpdateStatus(record.id, record.title, CourseStatus.APPROVED),
          },
          {
            key: CourseStatus.REJECTED,
            label: 'Từ chối',
            icon: <CloseCircleOutlined />,
            danger: true,
            disabled: record.status === CourseStatus.REJECTED,
            onClick: () => handleUpdateStatus(record.id, record.title, CourseStatus.REJECTED),
          },
          {
            key: CourseStatus.PUBLISHED,
            label: 'Xuất bản',
            disabled: record.status === CourseStatus.PUBLISHED,
            onClick: () => handleUpdateStatus(record.id, record.title, CourseStatus.PUBLISHED),
          },
        ];

        return (
          <Space size="small">
            {/* <Button
              type="primary"
              ghost
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            >
              Xem
            </Button> */}
            <Dropdown menu={{ items: statusMenuItems }} trigger={['click']}>
              <Button loading={loading}>
                Đổi trạng thái <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Title level={2}>Quản Lý Khóa Học</Title>
      <Card>
        <Space style={{ marginBottom: 16 }} size="middle">
          <FilterOutlined />
          <span>Lọc theo trạng thái:</span>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 200 }}
            options={[
              { label: 'Tất cả', value: 'ALL' },
              { label: 'Chờ duyệt', value: CourseStatus.PENDING_REVIEW },
              { label: 'Đã duyệt', value: CourseStatus.APPROVED },
              { label: 'Từ chối', value: CourseStatus.REJECTED },
              { label: 'Đã xuất bản', value: CourseStatus.PUBLISHED },
            ]}
          />
          <Tag color="blue">Tổng: {filteredData.length}</Tag>
        </Space>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={tableLoading}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Chi Tiết Khóa Học"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={900}
      >
        {selectedCourse && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                {selectedCourse.thumbnailUrl && (
                  <Image
                    src={selectedCourse.thumbnailUrl}
                    alt={selectedCourse.title}
                    style={{ width: '100%', borderRadius: 8 }}
                  />
                )}
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="Số Chương"
                    value={selectedCourse.chapterCount || 0}
                    prefix={<FileTextOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="Số Bài Học"
                    value={selectedCourse.episodeCount || 0}
                    prefix={<PlayCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="Học Viên"
                    value={selectedCourse.enrollmentCount || 0}
                    prefix={<BookOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Descriptions column={2} bordered style={{ marginTop: 24 }}>
              <Descriptions.Item label="Tên Khóa Học" span={2}>
                {selectedCourse.title}
              </Descriptions.Item>
              <Descriptions.Item label="Giáo Viên">
                {selectedCourse.teacher?.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedCourse.teacher?.email}
              </Descriptions.Item>
              <Descriptions.Item label="Môn Học">
                {selectedCourse.subject?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Khối Lớp">
                {selectedCourse.gradeLevel?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày Tạo">
                {dayjs(selectedCourse.createdAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày Nộp">
                {selectedCourse.submittedAt
                  ? dayjs(selectedCourse.submittedAt).format('DD/MM/YYYY HH:mm')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng Thái" span={2}>
                <Tag
                  color={
                    selectedCourse.status === CourseStatus.PENDING_REVIEW
                      ? 'gold'
                      : selectedCourse.status === CourseStatus.APPROVED
                      ? 'green'
                      : selectedCourse.status === CourseStatus.REJECTED
                      ? 'red'
                      : 'blue'
                  }
                >
                  {selectedCourse.status === CourseStatus.PENDING_REVIEW
                    ? 'Chờ duyệt'
                    : selectedCourse.status === CourseStatus.APPROVED
                    ? 'Đã duyệt'
                    : selectedCourse.status === CourseStatus.REJECTED
                    ? 'Từ chối'
                    : 'Đã xuất bản'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {selectedCourse.summary && (
              <div style={{ marginTop: 24 }}>
                <Title level={5}>Mô Tả Khóa Học</Title>
                <Paragraph>{selectedCourse.summary}</Paragraph>
              </div>
            )}

            {selectedCourse.rejectionReason && (
              <div style={{ marginTop: 24 }}>
                <Title level={5} type="danger">
                  Lý Do Từ Chối
                </Title>
                <Card size="small" style={{ marginTop: 12, background: '#fff1f0' }}>
                  {selectedCourse.rejectionReason}
                </Card>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Từ Chối Khóa Học"
        open={rejectVisible}
        onOk={handleRejectSubmit}
        onCancel={() => setRejectVisible(false)}
        confirmLoading={loading}
        okText="Xác Nhận Từ Chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <p style={{ marginBottom: 12 }}>
          Bạn đang từ chối khóa học: <strong>{selectedCourse?.title}</strong>
        </p>
        <TextArea
          rows={4}
          placeholder="Nhập lý do từ chối (bắt buộc)..."
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          maxLength={500}
          showCount
        />
      </Modal>
    </div>
  );
};

export default CourseApproval;
