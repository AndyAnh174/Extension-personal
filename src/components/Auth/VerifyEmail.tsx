import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, message } from 'antd';
import { MailOutlined, CheckCircleOutlined, SyncOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Title, Text } = Typography;

interface LocationState {
  email: string;
  isNewRegistration?: boolean;
}

const VerifyEmail = () => {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = (location.state as LocationState) || {};

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      message.error('Vui lòng nhập đủ mã xác thực 6 số');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/users/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setIsVerified(true);
      message.success('Xác thực email thành công!');
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/users/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setCountdown(data.remainingTime || 60);
          throw new Error('Vui lòng đợi trước khi gửi lại mã');
        }
        throw new Error(data.error);
      }

      message.success('Đã gửi lại mã xác thực!');
      setCountdown(60);
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="text-center">
          {!isVerified ? (
            <>
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-blue-100 p-4">
                  <MailOutlined className="text-4xl text-blue-500" />
                </div>
              </div>
              
              <Title level={3}>Xác thực email của bạn</Title>
              <Text type="secondary" className="block mb-8">
                Chúng tôi đã gửi mã xác thực đến email {email}
              </Text>

              <div className="mb-8 flex justify-center gap-2">
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="h-12 w-12 rounded-lg border border-gray-300 text-center text-2xl focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <Button
                type="primary"
                size="large"
                block
                onClick={handleVerify}
                loading={loading}
                icon={<CheckCircleOutlined />}
                className="mb-4 bg-gradient-to-r from-blue-500 to-purple-600 border-0"
              >
                Xác thực
              </Button>

              <div className="text-center">
                <Text type="secondary">Không nhận được mã? </Text>
                <Button
                  type="link"
                  onClick={handleResendCode}
                  disabled={countdown > 0}
                  loading={resendLoading}
                  icon={<SyncOutlined spin={resendLoading} />}
                >
                  {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircleOutlined className="text-4xl text-green-500" />
                </div>
              </div>
              
              <Title level={3}>Xác thực thành công!</Title>
              <Text type="secondary" className="block mb-8">
                Bạn đã xác thực email thành công. Bây giờ bạn có thể đăng nhập vào tài khoản của mình.
              </Text>

              <Button
                type="primary"
                size="large"
                block
                onClick={handleGoToLogin}
                icon={<LoginOutlined />}
                className="bg-gradient-to-r from-blue-500 to-purple-600 border-0"
              >
                Đăng nhập ngay
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default VerifyEmail; 