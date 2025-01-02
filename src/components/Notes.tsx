import { useState, useEffect } from 'react'
import { Button, Card, Input, List, Tag, Typography, Modal } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'

const { Title, Text } = Typography
const { TextArea } = Input

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: number
}

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentNote, setCurrentNote] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    chrome.storage.local.get(['notes'], (result) => {
      if (result.notes) {
        setNotes(result.notes)
      }
    })
  }, [])

  const saveNote = () => {
    if (!title || !content) return

    const newNotes = [...notes]
    
    if (currentNote) {
      const index = newNotes.findIndex(n => n.id === currentNote.id)
      newNotes[index] = {
        ...currentNote,
        title,
        content,
        tags
      }
    } else {
      newNotes.push({
        id: Date.now().toString(),
        title,
        content,
        tags,
        createdAt: Date.now()
      })
    }

    setNotes(newNotes)
    chrome.storage.local.set({ notes: newNotes })
    resetForm()
  }

  const deleteNote = (id: string) => {
    const newNotes = notes.filter(note => note.id !== id)
    setNotes(newNotes)
    chrome.storage.local.set({ notes: newNotes })
  }

  const editNote = (note: Note) => {
    setCurrentNote(note)
    setTitle(note.title)
    setContent(note.content)
    setTags(note.tags)
    setIsModalVisible(true)
  }

  const resetForm = () => {
    setCurrentNote(null)
    setTitle('')
    setContent('')
    setTags([])
    setIsModalVisible(false)
  }

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title level={4}>Ghi chú</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Thêm ghi chú
        </Button>
      </div>

      <List
        grid={{ gutter: 16, column: 2 }}
        dataSource={notes}
        renderItem={note => (
          <List.Item>
            <Card
              title={note.title}
              extra={
                <div className="space-x-2">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => editNote(note)}
                  />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deleteNote(note.id)}
                  />
                </div>
              }
            >
              <div className="space-y-4">
                <Text>{note.content}</Text>
                <div className="space-x-2">
                  {note.tags.map(tag => (
                    <Tag key={tag} color="blue">{tag}</Tag>
                  ))}
                </div>
                <Text type="secondary" className="text-sm">
                  {new Date(note.createdAt).toLocaleDateString()}
                </Text>
              </div>
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title={currentNote ? 'Sửa ghi chú' : 'Thêm ghi chú'}
        open={isModalVisible}
        onOk={saveNote}
        onCancel={resetForm}
      >
        <div className="space-y-4">
          <div>
            <Text>Tiêu đề</Text>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề"
            />
          </div>

          <div>
            <Text>Nội dung</Text>
            <TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung"
              rows={4}
            />
          </div>

          <div>
            <Text>Tags</Text>
            <div className="flex gap-2 mb-2">
              {tags.map(tag => (
                <Tag
                  key={tag}
                  closable
                  onClose={() => removeTag(tag)}
                >
                  {tag}
                </Tag>
              ))}
            </div>
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onPressEnter={addTag}
              placeholder="Nhập tag và nhấn Enter"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Notes 