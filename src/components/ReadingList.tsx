import { useState, useEffect } from 'react'
import { Button, Card, Input, List, Tag, Typography, Modal, Select } from 'antd'
import { 
  PlusOutlined, 
  DeleteOutlined, 
  CheckOutlined,
  LinkOutlined,
  FolderOutlined 
} from '@ant-design/icons'

const { Title, Text } = Typography
const { Option } = Select

interface Article {
  id: string
  url: string
  title: string
  category: string
  isRead: boolean
  addedAt: number
}

const ReadingList = () => {
  const [articles, setArticles] = useState<Article[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  useEffect(() => {
    chrome.storage.local.get(['articles', 'categories'], (result) => {
      if (result.articles) {
        setArticles(result.articles)
      }
      if (result.categories) {
        setCategories(result.categories)
      }
    })
  }, [])

  const addArticle = () => {
    if (!url || !title) return

    const newArticle: Article = {
      id: Date.now().toString(),
      url,
      title,
      category,
      isRead: false,
      addedAt: Date.now()
    }

    const newArticles = [...articles, newArticle]
    setArticles(newArticles)
    chrome.storage.local.set({ articles: newArticles })

    if (category && !categories.includes(category)) {
      const newCategories = [...categories, category]
      setCategories(newCategories)
      chrome.storage.local.set({ categories: newCategories })
    }

    resetForm()
  }

  const toggleRead = (id: string) => {
    const newArticles = articles.map(article => {
      if (article.id === id) {
        return { ...article, isRead: !article.isRead }
      }
      return article
    })
    setArticles(newArticles)
    chrome.storage.local.set({ articles: newArticles })
  }

  const deleteArticle = (id: string) => {
    const newArticles = articles.filter(article => article.id !== id)
    setArticles(newArticles)
    chrome.storage.local.set({ articles: newArticles })
  }

  const resetForm = () => {
    setUrl('')
    setTitle('')
    setCategory('')
    setIsModalVisible(false)
  }

  const filteredArticles = articles.filter(article => {
    const readFilter = filter === 'all' ? true : filter === 'read' ? article.isRead : !article.isRead
    const catFilter = categoryFilter === 'all' ? true : article.category === categoryFilter
    return readFilter && catFilter
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title level={4}>Danh sách đọc</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Thêm bài viết
        </Button>
      </div>

      <div className="flex gap-4">
        <Select
          className="w-40"
          value={filter}
          onChange={setFilter}
        >
          <Option value="all">Tất cả</Option>
          <Option value="unread">Chưa đọc</Option>
          <Option value="read">Đã đọc</Option>
        </Select>

        <Select
          className="w-40"
          value={categoryFilter}
          onChange={setCategoryFilter}
        >
          <Option value="all">Tất cả danh mục</Option>
          {categories.map(cat => (
            <Option key={cat} value={cat}>{cat}</Option>
          ))}
        </Select>
      </div>

      <List
        grid={{ gutter: 16, column: 2 }}
        dataSource={filteredArticles}
        renderItem={article => (
          <List.Item>
            <Card
              actions={[
                <Button
                  type="text"
                  icon={<CheckOutlined />}
                  onClick={() => toggleRead(article.id)}
                  className={article.isRead ? 'text-green-600' : ''}
                />,
                <Button
                  type="text"
                  icon={<LinkOutlined />}
                  onClick={() => window.open(article.url, '_blank')}
                />,
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => deleteArticle(article.id)}
                />
              ]}
            >
              <div className="space-y-4">
                <Text strong className={article.isRead ? 'line-through' : ''}>
                  {article.title}
                </Text>
                <div>
                  <Tag icon={<FolderOutlined />} color="blue">
                    {article.category || 'Chưa phân loại'}
                  </Tag>
                </div>
                <Text type="secondary" className="text-sm">
                  {new Date(article.addedAt).toLocaleDateString()}
                </Text>
              </div>
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title="Thêm bài viết"
        open={isModalVisible}
        onOk={addArticle}
        onCancel={resetForm}
      >
        <div className="space-y-4">
          <div>
            <Text>URL</Text>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <Text>Tiêu đề</Text>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tiêu đề bài viết"
            />
          </div>

          <div>
            <Text>Danh mục</Text>
            <Select
              className="w-full"
              value={category}
              onChange={setCategory}
              showSearch
              allowClear
              placeholder="Chọn hoặc thêm danh mục mới"
            >
              {categories.map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ReadingList 