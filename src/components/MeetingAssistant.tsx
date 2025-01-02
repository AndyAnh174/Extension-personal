import { useState, useEffect } from 'react'
import { Button, Card, Input, List, Typography, Modal, DatePicker, TimePicker, Tag, message, Tooltip } from 'antd'
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined,
  TeamOutlined,
  LinkOutlined,
  ClockCircleOutlined,
  FileTextOutlined 
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

interface Meeting {
  id: string
  title: string
  description: string
  date: number
  time: string
  platform: string
  link: string
  notes: string
  createdAt: number
}

const MeetingAssistant = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState<dayjs.Dayjs>(dayjs())
  const [time, setTime] = useState<dayjs.Dayjs>(dayjs())
  const [platform, setPlatform] = useState('')
  const [link, setLink] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    chrome.storage.local.get(['meetings'], (result) => {
      if (result.meetings) {
        setMeetings(result.meetings)
      }
    })

    // Kiểm tra và gửi thông báo cho các cuộc họp sắp diễn ra
    const checkUpcomingMeetings = () => {
      const now = dayjs()
      meetings.forEach(meeting => {
        const meetingTime = dayjs(`${dayjs(meeting.date).format('YYYY-MM-DD')} ${meeting.time}`)
        const diff = meetingTime.diff(now, 'minute')
        
        if (diff === 15) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Sắp đến giờ họp!',
            message: `Cuộc họp "${meeting.title}" sẽ bắt đầu trong 15 phút nữa.`
          })
        }
      })
    }

    const interval = setInterval(checkUpcomingMeetings, 60000)
    return () => clearInterval(interval)
  }, [meetings])

  const saveMeeting = () => {
    if (!title || !date || !time) return

    const newMeetings = [...meetings]
    
    if (currentMeeting) {
      const index = newMeetings.findIndex(m => m.id === currentMeeting.id)
      newMeetings[index] = {
        ...currentMeeting,
        title,
        description,
        date: date.valueOf(),
        time: time.format('HH:mm'),
        platform,
        link,
        notes
      }
    } else {
      newMeetings.push({
        id: Date.now().toString(),
        title,
        description,
        date: date.valueOf(),
        time: time.format('HH:mm'),
        platform,
        link,
        notes,
        createdAt: Date.now()
      })
    }

    setMeetings(newMeetings)
    chrome.storage.local.set({ meetings: newMeetings })
    resetForm()
  }

  const deleteMeeting = (id: string) => {
    const newMeetings = meetings.filter(meeting => meeting.id !== id)
    setMeetings(newMeetings)
    chrome.storage.local.set({ meetings: newMeetings })
  }

  const editMeeting = (meeting: Meeting) => {
    setCurrentMeeting(meeting)
    setTitle(meeting.title)
    setDescription(meeting.description)
    setDate(dayjs(meeting.date))
    setTime(dayjs(meeting.time, 'HH:mm'))
    setPlatform(meeting.platform)
    setLink(meeting.link)
    setNotes(meeting.notes)
    setIsModalVisible(true)
  }

  const resetForm = () => {
    setCurrentMeeting(null)
    setTitle('')
    setDescription('')
    setDate(dayjs())
    setTime(dayjs())
    setPlatform('')
    setLink('')
    setNotes('')
    setIsModalVisible(false)
  }

  const joinMeeting = (link: string) => {
    if (!link) {
      message.error('Không có link cuộc họp')
      return
    }
    window.open(link, '_blank')
  }

  const sortedMeetings = [...meetings].sort((a, b) => {
    const dateA = dayjs(`${dayjs(a.date).format('YYYY-MM-DD')} ${a.time}`)
    const dateB = dayjs(`${dayjs(b.date).format('YYYY-MM-DD')} ${b.time}`)
    return dateA.valueOf() - dateB.valueOf()
  })

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between mb-8">
        <Title level={4} className="!mb-0">Quản lý cuộc họp</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Thêm cuộc họp
        </Button>
      </div>

      <List
        dataSource={sortedMeetings}
        renderItem={meeting => {
          const meetingTime = dayjs(`${dayjs(meeting.date).format('YYYY-MM-DD')} ${meeting.time}`)
          const isPast = meetingTime.isBefore(dayjs())

          return (
            <Card
              className={`mb-4 shadow-sm hover:shadow-md transition-all hover:z-[99999] relative ${isPast ? 'opacity-60' : ''}`}
              actions={[
                <Tooltip title="Tham gia cuộc họp" overlayStyle={{ zIndex: 99999 }}>
                  <Button
                    type="text"
                    icon={<LinkOutlined />}
                    onClick={() => joinMeeting(meeting.link)}
                    disabled={isPast}
                  />
                </Tooltip>,
                <Tooltip title="Chỉnh sửa" overlayStyle={{ zIndex: 99999 }}>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => editMeeting(meeting)}
                  />
                </Tooltip>,
                <Tooltip title="Xóa" overlayStyle={{ zIndex: 99999 }}>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deleteMeeting(meeting.id)}
                  />
                </Tooltip>
              ]}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Text strong>{meeting.title}</Text>
                  <Tag icon={<TeamOutlined />} color="blue">
                    {meeting.platform || 'Chưa xác định'}
                  </Tag>
                </div>

                {meeting.description && (
                  <Paragraph className="text-gray-600">
                    {meeting.description}
                  </Paragraph>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-x-2">
                    <Tag icon={<ClockCircleOutlined />}>
                      {dayjs(meeting.date).format('DD/MM/YYYY')} {meeting.time}
                    </Tag>
                    {meeting.notes && (
                      <Tag icon={<FileTextOutlined />}>
                        Có ghi chú
                      </Tag>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )
        }}
      />

      <Modal
        title={currentMeeting ? 'Sửa cuộc họp' : 'Thêm cuộc họp'}
        open={isModalVisible}
        onOk={saveMeeting}
        onCancel={resetForm}
        style={{ zIndex: 99999 }}
      >
        <div className="space-y-4">
          <div>
            <Text>Tiêu đề</Text>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề cuộc họp"
            />
          </div>

          <div>
            <Text>Mô tả</Text>
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả chi tiết"
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Text>Ngày</Text>
              <DatePicker
                className="w-full"
                value={date}
                onChange={(value) => value && setDate(value)}
                format="DD/MM/YYYY"
              />
            </div>
            <div className="flex-1">
              <Text>Giờ</Text>
              <TimePicker
                className="w-full"
                value={time}
                onChange={(value) => value && setTime(value)}
                format="HH:mm"
              />
            </div>
          </div>

          <div>
            <Text>Nền tảng</Text>
            <Input
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="VD: Google Meet, Zoom, ..."
            />
          </div>

          <div>
            <Text>Link cuộc họp</Text>
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <Text>Ghi chú</Text>
            <TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú cho cuộc họp"
              rows={4}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default MeetingAssistant 