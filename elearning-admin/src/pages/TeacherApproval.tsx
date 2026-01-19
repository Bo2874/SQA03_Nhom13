import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  message,
  Typography,
  Avatar,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  UserOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import axios from 'axios';
import {
  uploadImageToCloudinary,
  isValidImageFile,
  isValidFileSize,
  formatFileSize,
} from '../utils/cloudinary';

const { Title } = Typography;

interface Teacher {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateTeacherForm {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone?: string;
}

interface EditTeacherForm {
  fullName: string;
  phone?: string;
  email: string;
}

const API_URL = 'http://localhost:3000/api/v1';

const TeacherManagement: React.FC = () => {
  const [data, setData] = useState<Teacher[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [form] = Form.useForm<CreateTeacherForm>();
  const [editForm] = Form.useForm<EditTeacherForm>();

  // Fetch teachers on mount
  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/teachers`, {
        params: {
          page: 1,
          limit: 100,
          sortBy: 'createdAt',
          order: 'DESC',
        },
        withCredentials: true,
      });

      setData(response.data.result?.data || []);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể tải danh sách giáo viên');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    setCreateModalVisible(true);
  };

  const handleCreateSubmit = async (values: CreateTeacherForm) => {
    if (values.password !== values.confirmPassword) {
      message.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    setLoading(true);
    try {
      const requestData: any = {
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone,
      };

      // Only add avatarUrl if it exists and is not empty
      if (avatarUrl && avatarUrl.trim()) {
        requestData.avatarUrl = avatarUrl;
      }

      console.log('Creating teacher with data:', requestData);

      await axios.post(
        `${API_URL}/teachers`,
        requestData,
        { withCredentials: true }
      );

      message.success('Tạo tài khoản giáo viên thành công!');
      setCreateModalVisible(false);
      form.resetFields();
      setAvatarUrl('');
      fetchTeachers();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/teachers/${id}`, {
        withCredentials: true,
      });

      message.success('Xóa giáo viên thành công!');
      fetchTeachers();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setAvatarUrl(teacher.avatarUrl || '');
    editForm.setFieldsValue({
      fullName: teacher.fullName,
      phone: teacher.phone,
      email: teacher.email,
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async (values: EditTeacherForm) => {
    if (!editingTeacher) return;

    setLoading(true);
    try {
      const requestData: any = {
        fullName: values.fullName,
        phone: values.phone,
      };

      // Only add avatarUrl if it exists and is not empty
      if (avatarUrl && avatarUrl.trim()) {
        requestData.avatarUrl = avatarUrl;
      }

      console.log('Updating teacher with data:', requestData);

      await axios.patch(
        `${API_URL}/teachers/${editingTeacher.id}`,
        requestData,
        { withCredentials: true }
      );

      message.success('Cập nhật thông tin giáo viên thành công!');
      setEditModalVisible(false);
      editForm.resetFields();
      setAvatarUrl('');
      setEditingTeacher(null);
      fetchTeachers();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    // Validate file type
    if (!isValidImageFile(file)) {
      message.error('Vui lòng chọn file ảnh hợp lệ (JPG, PNG, GIF, WebP)');
      return false;
    }

    // Validate file size (max 5MB)
    if (!isValidFileSize(file, 5)) {
      message.error(`Kích thước file không được vượt quá 5MB. File hiện tại: ${formatFileSize(file.size)}`);
      return false;
    }

    // Upload to Cloudinary
    try {
      setIsUploading(true);
      setUploadProgress(0);

      const response = await uploadImageToCloudinary(file, (progress) => {
        setUploadProgress(progress.percentage);
      });

      setAvatarUrl(response.secure_url);
      message.success('Upload ảnh thành công!');
    } catch (error: any) {
      console.error('Upload error:', error);
      message.error(error.message || 'Upload ảnh thất bại. Vui lòng thử lại!');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }

    return false; // Prevent default upload behavior
  };

  const columns: ColumnsType<Teacher> = [
    {
      title: 'STT',
      key: 'index',
      width: 80,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Giáo Viên',
      key: 'teacher',
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatarUrl} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.fullName}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Số Điện Thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || '-',
    },
    {
      title: 'Ngày Tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'ACTIVE' ? 'green' : 'red';
        const text = status === 'ACTIVE' ? 'Hoạt động' : 'Vô hiệu hóa';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Thao Tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa giáo viên này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} loading={loading}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>Quản Lý Giáo Viên</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          size="large"
        >
          Tạo Tài Khoản Giáo Viên
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `Tổng ${total} giáo viên` }}
        />
      </Card>

      {/* Create Teacher Modal */}
      <Modal
        title="Tạo Tài Khoản Giáo Viên"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
          setAvatarUrl('');
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateSubmit}
        >
          <Form.Item label="Ảnh Đại Diện">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                icon={<UploadOutlined />}
                loading={isUploading}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e: any) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                  };
                  input.click();
                }}
              >
                {isUploading ? `Đang upload ${uploadProgress}%` : 'Upload Ảnh'}
              </Button>
              {avatarUrl && (
                <div style={{ marginTop: 12 }}>
                  <Avatar src={avatarUrl} size={80} icon={<UserOutlined />} />
                </div>
              )}
            </Space>
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' },
            ]}
          >
            <Input placeholder="teacher@example.com" size="large" />
          </Form.Item>

          <Form.Item
            label="Họ và Tên"
            name="fullName"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
          >
            <Input placeholder="Nguyễn Văn A" size="large" />
          </Form.Item>

          <Form.Item
            label="Số Điện Thoại"
            name="phone"
          >
            <Input placeholder="0901234567" size="large" />
          </Form.Item>

          <Form.Item
            label="Mật Khẩu"
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
            ]}
          >
            <Input.Password placeholder="Tối thiểu 6 ký tự" size="large" />
          </Form.Item>

          <Form.Item
            label="Xác Nhận Mật Khẩu"
            name="confirmPassword"
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu" size="large" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setCreateModalVisible(false);
                form.resetFields();
                setAvatarUrl('');
              }}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Tạo Tài Khoản
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Teacher Modal */}
      <Modal
        title="Chỉnh Sửa Thông Tin Giáo Viên"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
          setAvatarUrl('');
          setEditingTeacher(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
        >
          <Form.Item label="Ảnh Đại Diện">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                icon={<UploadOutlined />}
                loading={isUploading}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e: any) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                  };
                  input.click();
                }}
              >
                {isUploading ? `Đang upload ${uploadProgress}%` : 'Upload Ảnh Mới'}
              </Button>
              {avatarUrl && (
                <div style={{ marginTop: 12 }}>
                  <Avatar src={avatarUrl} size={80} icon={<UserOutlined />} />
                </div>
              )}
            </Space>
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
          >
            <Input disabled size="large" />
          </Form.Item>

          <Form.Item
            label="Họ và Tên"
            name="fullName"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
          >
            <Input placeholder="Nguyễn Văn A" size="large" />
          </Form.Item>

          <Form.Item
            label="Số Điện Thoại"
            name="phone"
          >
            <Input placeholder="0901234567" size="large" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setEditModalVisible(false);
                editForm.resetFields();
                setAvatarUrl('');
                setEditingTeacher(null);
              }}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Cập Nhật
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeacherManagement;
