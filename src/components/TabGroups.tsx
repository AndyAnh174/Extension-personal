import { useState, useEffect } from 'react';
import { Button, List, Card, Popconfirm, message, Table, Space, Tabs, Badge, Tooltip, Empty } from 'antd';
import { SaveOutlined, DeleteOutlined, PlusOutlined, FolderOpenOutlined, LinkOutlined } from '@ant-design/icons';
import SaveTabsModal from './SaveTabsModal';
import type { TableColumnType } from 'antd';

interface TabGroup {
  id: string;
  name: string;
  tabs: chrome.tabs.Tab[];
  createdAt: number;
}

const TabGroups = () => {
  const [groups, setGroups] = useState<TabGroup[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentTabs, setCurrentTabs] = useState<chrome.tabs.Tab[]>([]);
  const [selectedTabs, setSelectedTabs] = useState<chrome.tabs.Tab[]>([]);
  const [saveMode, setSaveMode] = useState<'all' | 'selected'>('all');

  useEffect(() => {
    loadGroups();
    loadCurrentTabs();
  }, []);

  const loadCurrentTabs = async () => {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    setCurrentTabs(tabs);
  };

  // Load saved groups
  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const result = await chrome.storage.local.get('tabGroups');
      setGroups(result.tabGroups || []);
    } catch (error) {
      console.error('Error loading groups:', error);
      message.error('Không thể tải danh sách nhóm');
    }
  };

  const handleSaveNewGroup = async (groupName: string) => {
    try {
      const tabsToSave = saveMode === 'all' ? currentTabs : selectedTabs;
      
      const newGroup: TabGroup = {
        id: Date.now().toString(),
        name: groupName,
        tabs: tabsToSave,
        createdAt: Date.now()
      };

      const updatedGroups = [...groups, newGroup];
      await chrome.storage.local.set({ tabGroups: updatedGroups });
      
      setGroups(updatedGroups);
      setModalVisible(false);
      setSelectedTabs([]);
      message.success('Đã lưu danh sách tab thành công!');
    } catch (error) {
      console.error('Error saving group:', error);
      message.error('Không thể lưu danh sách tab');
    }
  };

  const handleOpenGroup = async (group: TabGroup) => {
    try {
      // Lọc bỏ các URL undefined
      const urls = group.tabs
        .map(tab => tab.url)
        .filter((url): url is string => url !== undefined);

      await chrome.windows.create({
        url: urls,
        focused: true
      });
      message.success('Đã mở nhóm tab');
    } catch (error) {
      console.error('Error opening group:', error);
      message.error('Không thể mở nhóm tab');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const updatedGroups = groups.filter(g => g.id !== groupId);
      await chrome.storage.local.set({ tabGroups: updatedGroups });
      setGroups(updatedGroups);
      message.success('Đã xóa nhóm tab');
    } catch (error) {
      console.error('Error deleting group:', error);
      message.error('Không thể xóa nhóm tab');
    }
  };

  const columns: TableColumnType<chrome.tabs.Tab>[] = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      width: '40%',
      render: (text: string, tab: chrome.tabs.Tab) => (
        <Tooltip title={text}>
          <div className="flex items-center">
            <img 
              src={tab.favIconUrl || '/icons/icon16.png'} 
              className="w-4 h-4 mr-2"
              alt=""
            />
            <span className="truncate">{text}</span>
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      width: '40%',
      render: (text: string) => (
        <Tooltip title={text}>
          <span className="truncate text-gray-500 flex items-center">
            <LinkOutlined className="mr-1" />
            {text}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: '20%',
      render: (_: unknown, tab: chrome.tabs.Tab) => {
        const isSelected = selectedTabs.some(t => t.id === tab.id);
        return (
          <Button
            type={isSelected ? 'default' : 'primary'}
            size="small"
            icon={<PlusOutlined />}
            onClick={() => {
              if (!isSelected) {
                setSelectedTabs([...selectedTabs, tab]);
                message.success('Đã thêm tab vào danh sách');
              }
            }}
            disabled={isSelected}
          >
            {isSelected ? 'Đã thêm' : 'Thêm'}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <Card className="shadow-md">
        <Tabs
          defaultActiveKey="current"
          items={[
            {
              key: 'current',
              label: (
                <span>
                  Tab hiện tại
                  <Badge count={currentTabs.length} className="ml-2" />
                </span>
              ),
              children: (
                <div>
                  <div className="mb-4 flex justify-between items-center">
                    <span className="text-gray-500">
                      Tổng số tab: {currentTabs.length}
                    </span>
                    <Space>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={() => {
                          setSaveMode('selected');
                          if (selectedTabs.length === 0) {
                            message.warning('Vui lòng chọn ít nhất một tab để lưu');
                            return;
                          }
                          setModalVisible(true);
                        }}
                        disabled={selectedTabs.length === 0}
                      >
                        Lưu tab đã chọn ({selectedTabs.length})
                      </Button>
                      <Button
                        type="default"
                        icon={<SaveOutlined />}
                        onClick={() => {
                          setSaveMode('all');
                          setModalVisible(true);
                        }}
                      >
                        Lưu tất cả
                      </Button>
                    </Space>
                  </div>
                  <Table
                    columns={columns}
                    dataSource={currentTabs}
                    rowKey="id"
                    pagination={false}
                    scroll={{ y: 400 }}
                    size="middle"
                    className="border rounded-lg"
                  />
                </div>
              ),
            },
            {
              key: 'selected',
              label: (
                <span>
                  Tab đã chọn
                  <Badge count={selectedTabs.length} className="ml-2" />
                </span>
              ),
              children: selectedTabs.length > 0 ? (
                <List
                  className="border rounded-lg p-4"
                  itemLayout="horizontal"
                  dataSource={selectedTabs}
                  renderItem={tab => (
                    <List.Item
                      actions={[
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            setSelectedTabs(selectedTabs.filter(t => t.id !== tab.id));
                            message.success('Đã xóa tab khỏi danh sách');
                          }}
                        />
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<img src={tab.favIconUrl || '/icons/icon16.png'} className="w-6 h-6" alt="" />}
                        title={<span className="font-medium">{tab.title}</span>}
                        description={
                          <span className="text-gray-500 flex items-center">
                            <LinkOutlined className="mr-1" />
                            {tab.url}
                          </span>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Chưa có tab nào được chọn"
                />
              ),
            },
            {
              key: 'saved',
              label: (
                <span>
                  Nhóm đã lưu
                  <Badge count={groups.length} className="ml-2" />
                </span>
              ),
              children: groups.length > 0 ? (
                <List
                  grid={{ gutter: 16, column: 3 }}
                  dataSource={groups}
                  renderItem={group => (
                    <List.Item>
                      <Card
                        hoverable
                        className="shadow-sm transition-all hover:shadow-md"
                        actions={[
                          <Tooltip title="Mở nhóm tab">
                            <Button
                              type="text"
                              icon={<FolderOpenOutlined />}
                              onClick={() => handleOpenGroup(group)}
                            />
                          </Tooltip>,
                          <Popconfirm
                            title="Bạn có chắc muốn xóa nhóm tab này?"
                            onConfirm={() => handleDeleteGroup(group.id)}
                            okText="Xóa"
                            cancelText="Hủy"
                          >
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                            />
                          </Popconfirm>
                        ]}
                      >
                        <Card.Meta
                          title={group.name}
                          description={
                            <div>
                              <Badge count={group.tabs.length} className="mb-2" /> tab
                              <div className="text-gray-400 text-sm">
                                Tạo ngày: {new Date(group.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          }
                        />
                      </Card>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Chưa có nhóm tab nào được lưu"
                />
              ),
            },
          ]}
        />
      </Card>

      <SaveTabsModal
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          if (saveMode === 'selected') {
            setSelectedTabs([]);
          }
        }}
        onSave={handleSaveNewGroup}
      />
    </div>
  );
};

export default TabGroups; 