import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Descriptions,
  Input,
  message,
  Typography,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Exam, ExamStatus } from '../types';
import { mockExams } from '../data/mockData';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Title } = Typography;

const ExamApproval: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Exam[]>(mockExams);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleView = (record: Exam) => {
    navigate(`/exams/${record.id}`);
  };

  const handleApprove = async (record: Exam) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setData((prev) =>
        prev.map((item) =>
          item.id === record.id
            ? {
                ...item,
                status: ExamStatus.APPROVED,
                approvedAt: new Date().toISOString(),
              }
            : item
        )
      );

      message.success(`Đã duyệt bài kiểm tra "${record.title}"`);
    } catch (error) {
      message.error('Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClick = (record: Exam) => {
    setSelectedExam(record);
    setRejectionReason('');
    setRejectVisible(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối!');
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setData((prev) =>
        prev.map((item) =>
          item.id === selectedExam?.id
            ? {
                ...item,
                status: ExamStatus.REJECTED,
                rejectionReason: rejectionReason,
              }
            : item
        )
      );

      message.success(`Đã từ chối bài kiểm tra "${selectedExam?.title}"`);
      setRejectVisible(false);
      setRejectionReason('');
    } catch (error) {
      message.error('Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<Exam> = [
    {
      title: 'Tên Bài Kiểm Tra',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{title}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            Giáo viên: {record.teacher?.fullName}
          </div>
        </div>
      ),
    },
    {
      title: 'Thời Gian Thi',
      key: 'time',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <div>Bắt đầu: {dayjs(record.startTime).format('DD/MM/YYYY HH:mm')}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            Kết thúc: {dayjs(record.endTime).format('DD/MM/YYYY HH:mm')}
          </div>
        </Space>
      ),
    },
    {
      title: 'Độ Dài',
      dataIndex: 'durationMinutes',
      key: 'duration',
      render: (minutes) => `${minutes} phút`,
    },
    {
      title: 'Số Câu',
      dataIndex: 'questionCount',
      key: 'questionCount',
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
      render: (status: ExamStatus) => {
        const config = {
          [ExamStatus.DRAFT]: { color: 'default', text: 'Nháp' },
          [ExamStatus.PENDING_REVIEW]: { color: 'gold', text: 'Chờ duyệt' },
          [ExamStatus.APPROVED]: { color: 'green', text: 'Đã duyệt' },
          [ExamStatus.LIVE]: { color: 'blue', text: 'Đang thi' },
          [ExamStatus.CLOSED]: { color: 'default', text: 'Đã đóng' },
        };
        return <Tag color={config[status].color}>{config[status].text}</Tag>;
      },
    },
    {
      title: 'Thao Tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            ghost
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            Xem
          </Button>
          {record.status === ExamStatus.PENDING_REVIEW && (
            <>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(record)}
                loading={loading}
              >
                Duyệt
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleRejectClick(record)}
              >
                Từ chối
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Duyệt Bài Kiểm Tra</Title>
      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Chi Tiết Bài Kiểm Tra"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedExam && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="Số Câu Hỏi"
                    value={selectedExam.questionCount || 0}
                    prefix={<FileTextOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="Thời Gian"
                    value={selectedExam.durationMinutes}
                    suffix="phút"
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="Lượt Thi"
                    value={selectedExam.attemptCount || 0}
                    prefix={<UserOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Descriptions column={2} bordered style={{ marginTop: 24 }}>
              <Descriptions.Item label="Tên Bài Kiểm Tra" span={2}>
                {selectedExam.title}
              </Descriptions.Item>
              <Descriptions.Item label="Giáo Viên">
                {selectedExam.teacher?.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedExam.teacher?.email}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày Tạo">
                {dayjs(selectedExam.createdAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày Nộp">
                {selectedExam.submittedAt
                  ? dayjs(selectedExam.submittedAt).format('DD/MM/YYYY HH:mm')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Thời Gian Bắt Đầu" span={2}>
                {dayjs(selectedExam.startTime).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Thời Gian Kết Thúc" span={2}>
                {dayjs(selectedExam.endTime).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Độ Dài Bài Thi">
                {selectedExam.durationMinutes} phút
              </Descriptions.Item>
              <Descriptions.Item label="Số Câu Hỏi">
                {selectedExam.questionCount || 0} câu
              </Descriptions.Item>
              <Descriptions.Item label="Trạng Thái" span={2}>
                <Tag
                  color={
                    selectedExam.status === ExamStatus.PENDING_REVIEW
                      ? 'gold'
                      : selectedExam.status === ExamStatus.APPROVED
                      ? 'green'
                      : selectedExam.status === ExamStatus.REJECTED
                      ? 'red'
                      : 'blue'
                  }
                >
                  {selectedExam.status === ExamStatus.PENDING_REVIEW
                    ? 'Chờ duyệt'
                    : selectedExam.status === ExamStatus.APPROVED
                    ? 'Đã duyệt'
                    : selectedExam.status === ExamStatus.REJECTED
                    ? 'Từ chối'
                    : selectedExam.status === ExamStatus.LIVE
                    ? 'Đang thi'
                    : 'Đã đóng'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {selectedExam.rejectionReason && (
              <div style={{ marginTop: 24 }}>
                <Title level={5} type="danger">
                  Lý Do Từ Chối
                </Title>
                <Card size="small" style={{ marginTop: 12, background: '#fff1f0' }}>
                  {selectedExam.rejectionReason}
                </Card>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Từ Chối Bài Kiểm Tra"
        open={rejectVisible}
        onOk={handleRejectSubmit}
        onCancel={() => setRejectVisible(false)}
        confirmLoading={loading}
        okText="Xác Nhận Từ Chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <p style={{ marginBottom: 12 }}>
          Bạn đang từ chối bài kiểm tra: <strong>{selectedExam?.title}</strong>
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

export default ExamApproval;
