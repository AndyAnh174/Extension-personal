import { useState } from 'react';
import { Modal, Input, Form } from 'antd';

interface SaveTabsModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (groupName: string) => void;
}

const SaveTabsModal = ({ visible, onCancel, onSave }: SaveTabsModalProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      onSave(values.groupName);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Lưu danh sách tab"
      open={visible}
      onCancel={onCancel}
      onOk={handleSave}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={loading}
    >
      <Form form={form}>
        <Form.Item
          name="groupName"
          label="Tên danh sách"
          rules={[{ required: true, message: 'Vui lòng nhập tên danh sách!' }]}
        >
          <Input placeholder="Nhập tên cho danh sách tab" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SaveTabsModal; 