import { Modal, Form, Input, Typography, Button, message } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { Text } = Typography;

interface StorageLocationModalProps {
  visible: boolean;
  onSave: (values: { location: string }) => void;
}

const StorageLocationModal = ({ visible, onSave }: StorageLocationModalProps) => {
  const [form] = Form.useForm();
  const [selectedPath, setSelectedPath] = useState('');

  const handleSelectFolder = async () => {
    try {
      // Tạo file JSON với dữ liệu ban đầu
      const initialData = {
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        website_stats: {}
      };

      // Chuyển đổi dữ liệu thành Blob
      const blob = new Blob([JSON.stringify(initialData, null, 2)], {
        type: 'application/json'
      });

      // Tạo URL cho blob
      const url = URL.createObjectURL(blob);

      // Tải file xuống và cho phép user chọn vị trí
      const downloadId = await chrome.downloads.download({
        url: url,
        filename: 'data-personal-extension.json',
        saveAs: true
      });

      // Lắng nghe sự kiện download hoàn tất
      chrome.downloads.onChanged.addListener(async function onChanged({ id, state }) {
        if (id === downloadId && state?.current === 'complete') {
          // Lấy thông tin về file đã tải
          const [downloadItem] = await chrome.downloads.search({ id: downloadId });
          if (downloadItem?.filename) {
            const path = downloadItem.filename.split('\\').slice(0, -1).join('\\');
            setSelectedPath(path);
            form.setFieldsValue({ location: path });

            // Lưu thông tin vào storage
            await chrome.storage.local.set({
              storageLocation: {
                name: path,
                filename: downloadItem.filename
              }
            });

            message.success(`Đã tạo file trong thư mục: ${path}`);
          }

          // Cleanup
          URL.revokeObjectURL(url);
          chrome.downloads.onChanged.removeListener(onChanged);
        }
      });
    } catch (error) {
      console.error('Error creating file:', error);
      message.error('Không thể tạo file');
    }
  };

  const handleSubmit = (values: { location: string }) => {
    if (!selectedPath) {
      message.error('Vui lòng chọn thư mục lưu dữ liệu!');
      return;
    }
    onSave(values);
  };

  return (
    <Modal
      title="Thiết lập vị trí lưu dữ liệu"
      open={visible}
      onOk={() => form.submit()}
      onCancel={() => {}}
      closable={false}
      maskClosable={false}
      okText="Bắt đầu"
      cancelButtonProps={{ style: { display: 'none' } }}
    >
      <div className="space-y-4">
        <Text>
          Để theo dõi thời gian sử dụng trình duyệt của bạn, chúng tôi cần một nơi để lưu trữ dữ liệu.
          Vui lòng chọn thư mục bạn muốn lưu dữ liệu.
        </Text>

        <Form form={form} onFinish={handleSubmit}>
          <Form.Item
            name="location"
            rules={[{ required: true, message: 'Vui lòng chọn thư mục lưu dữ liệu!' }]}
          >
            <Input
              readOnly
              value={selectedPath}
              placeholder="Chọn thư mục lưu dữ liệu"
              addonAfter={
                <Button
                  type="text"
                  icon={<FolderOpenOutlined />}
                  onClick={handleSelectFolder}
                >
                  Chọn thư mục
                </Button>
              }
            />
          </Form.Item>

          {selectedPath && (
            <Text type="success" className="block mb-4">
              Đã chọn thư mục: {selectedPath}
            </Text>
          )}

          <Text type="secondary" className="block mt-4">
            Lưu ý: 
            <ul className="list-disc list-inside mt-2">
              <li>Dữ liệu sẽ được lưu dưới dạng file JSON trong thư mục bạn chọn</li>
              <li>Bạn có thể dễ dàng sao lưu hoặc di chuyển dữ liệu bằng cách copy thư mục này</li>
              <li>Bạn có thể thay đổi vị trí lưu trữ sau trong phần cài đặt</li>
            </ul>
          </Text>
        </Form>
      </div>
    </Modal>
  );
};

export default StorageLocationModal; 