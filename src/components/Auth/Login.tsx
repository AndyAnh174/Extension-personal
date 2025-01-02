import { useState } from 'react';
import { Form, Input, Button, message, Typography, Divider } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresVerification) {
          navigate('/register');
          message.warning('Vui lòng xác thực email trước khi đăng nhập!');
          return;
        }
        throw new Error(data.error);
      }

      login(data.token, data.user);
      message.success('Đăng nhập thành công!');
      navigate('/');
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-2xl">
        <div className="text-center">
          <Title level={2} className="!mb-2">Đăng nhập</Title>
          <Text type="secondary">Chào mừng bạn trở lại!</Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          className="space-y-4"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input
              prefix={<MailOutlined className="text-gray-400" />}
              placeholder="Email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Mật khẩu"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              className="bg-gradient-to-r from-blue-500 to-purple-600 border-0"
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center">
          <Link to="/forgot-password" className="text-blue-500 hover:text-blue-600">
            Quên mật khẩu?
          </Link>
        </div>

        <Divider plain>Hoặc</Divider>

        <div className="text-center">
          <Text type="secondary">Chưa có tài khoản? </Text>
          <Link to="/register" className="text-blue-500 hover:text-blue-600">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login; 