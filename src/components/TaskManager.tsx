import { useState, useEffect } from 'react'
import { Button, Card, Input, List, Tag, Typography, Modal, DatePicker, Select, Progress, Tooltip } from 'antd'
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  FlagOutlined 
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { Option } = Select

interface Task {
  id: string
  title: string
  description: string
  project: string
  priority: 'low' | 'medium' | 'high'
  deadline: number
  completed: boolean
  createdAt: number
}

const TaskManager = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<string[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [project, setProject] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [deadline, setDeadline] = useState<dayjs.Dayjs>(dayjs().add(1, 'day'))
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active')
  const [projectFilter, setProjectFilter] = useState<string>('all')

  useEffect(() => {
    chrome.storage.local.get(['tasks', 'projects'], (result) => {
      if (result.tasks) {
        setTasks(result.tasks)
      }
      if (result.projects) {
        setProjects(result.projects)
      }
    })
  }, [])

  const saveTask = () => {
    if (!title || !description) return

    const newTasks = [...tasks]
    
    if (currentTask) {
      const index = newTasks.findIndex(t => t.id === currentTask.id)
      newTasks[index] = {
        ...currentTask,
        title,
        description,
        project,
        priority,
        deadline: deadline.valueOf()
      }
    } else {
      newTasks.push({
        id: Date.now().toString(),
        title,
        description,
        project,
        priority,
        deadline: deadline.valueOf(),
        completed: false,
        createdAt: Date.now()
      })
    }

    setTasks(newTasks)
    chrome.storage.local.set({ tasks: newTasks })

    if (project && !projects.includes(project)) {
      const newProjects = [...projects, project]
      setProjects(newProjects)
      chrome.storage.local.set({ projects: newProjects })
    }

    resetForm()
  }

  const toggleTask = (id: string) => {
    const newTasks = tasks.map(task => {
      if (task.id === id) {
        return { ...task, completed: !task.completed }
      }
      return task
    })
    setTasks(newTasks)
    chrome.storage.local.set({ tasks: newTasks })
  }

  const deleteTask = (id: string) => {
    const newTasks = tasks.filter(task => task.id !== id)
    setTasks(newTasks)
    chrome.storage.local.set({ tasks: newTasks })
  }

  const editTask = (task: Task) => {
    setCurrentTask(task)
    setTitle(task.title)
    setDescription(task.description)
    setProject(task.project)
    setPriority(task.priority)
    setDeadline(dayjs(task.deadline))
    setIsModalVisible(true)
  }

  const resetForm = () => {
    setCurrentTask(null)
    setTitle('')
    setDescription('')
    setProject('')
    setPriority('medium')
    setDeadline(dayjs().add(1, 'day'))
    setIsModalVisible(false)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red'
      case 'medium': return 'orange'
      case 'low': return 'green'
      default: return 'blue'
    }
  }

  const getProgress = () => {
    if (tasks.length === 0) return 0
    const completed = tasks.filter(task => task.completed).length
    return Math.round((completed / tasks.length) * 100)
  }

  const filteredTasks = tasks.filter(task => {
    const statusFilter = filter === 'all' ? true : filter === 'completed' ? task.completed : !task.completed
    const projFilter = projectFilter === 'all' ? true : task.project === projectFilter
    return statusFilter && projFilter
  }).sort((a, b) => {
    if (a.completed === b.completed) {
      return a.deadline - b.deadline
    }
    return a.completed ? 1 : -1
  })

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between mb-8">
        <Title level={4} className="!mb-0">Quản lý công việc</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Thêm công việc
        </Button>
      </div>

      <Card className="shadow-sm hover:shadow-md transition-all hover:z-[99999] relative">
        <div className="flex items-center justify-between mb-4">
          <Progress
            type="circle"
            percent={getProgress()}
            size="small"
            format={(percent) => `${percent}% hoàn thành`}
          />
          <div className="flex gap-4">
            <Select
              value={filter}
              onChange={setFilter}
              className="w-40"
              dropdownStyle={{ zIndex: 99999 }}
            >
              <Option value="all">Tất cả</Option>
              <Option value="active">Đang thực hiện</Option>
              <Option value="completed">Đã hoàn thành</Option>
            </Select>
            <Select
              value={projectFilter}
              onChange={setProjectFilter}
              className="w-40"
              dropdownStyle={{ zIndex: 99999 }}
            >
              <Option value="all">Tất cả dự án</Option>
              {projects.map(p => (
                <Option key={p} value={p}>{p}</Option>
              ))}
            </Select>
          </div>
        </div>

        <List
          dataSource={filteredTasks}
          renderItem={task => (
            <Card
              className={`mb-4 shadow-sm hover:shadow-md transition-all hover:z-[99999] relative ${task.completed ? 'opacity-60' : ''}`}
              actions={[
                <Tooltip title="Đánh dấu hoàn thành" overlayStyle={{ zIndex: 99999 }}>
                  <Button
                    type="text"
                    icon={<CheckOutlined />}
                    onClick={() => toggleTask(task.id)}
                    className={`${task.completed ? 'text-green-600' : ''}`}
                  />
                </Tooltip>,
                <Tooltip title="Chỉnh sửa" overlayStyle={{ zIndex: 99999 }}>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => editTask(task)}
                  />
                </Tooltip>,
                <Tooltip title="Xóa" overlayStyle={{ zIndex: 99999 }}>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deleteTask(task.id)}
                  />
                </Tooltip>
              ]}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Text
                    strong
                    className={task.completed ? 'line-through' : ''}
                  >
                    {task.title}
                  </Text>
                  <Tag color={getPriorityColor(task.priority)}>
                    {task.priority.toUpperCase()}
                  </Tag>
                </div>

                <Paragraph className="text-gray-600">
                  {task.description}
                </Paragraph>

                <div className="flex items-center justify-between">
                  <div className="space-x-2">
                    <Tag icon={<FlagOutlined />} color="blue">
                      {task.project || 'Chưa phân loại'}
                    </Tag>
                    <Tag
                      icon={<ClockCircleOutlined />}
                      color={dayjs(task.deadline).isBefore(dayjs()) ? 'red' : 'default'}
                    >
                      {dayjs(task.deadline).format('DD/MM/YYYY')}
                    </Tag>
                  </div>
                </div>
              </div>
            </Card>
          )}
        />
      </Card>

      <Modal
        title={currentTask ? 'Sửa công việc' : 'Thêm công việc'}
        open={isModalVisible}
        onOk={saveTask}
        onCancel={resetForm}
        style={{ zIndex: 99999 }}
      >
        <div className="space-y-4">
          <div>
            <Text>Tiêu đề</Text>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề công việc"
            />
          </div>

          <div>
            <Text>Mô tả</Text>
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả chi tiết"
              rows={4}
            />
          </div>

          <div>
            <Text>Dự án</Text>
            <Select
              className="w-full"
              value={project}
              onChange={setProject}
              showSearch
              allowClear
              placeholder="Chọn hoặc thêm dự án mới"
            >
              {projects.map(p => (
                <Option key={p} value={p}>{p}</Option>
              ))}
            </Select>
          </div>

          <div>
            <Text>Độ ưu tiên</Text>
            <Select
              className="w-full"
              value={priority}
              onChange={setPriority}
            >
              <Option value="low">Thấp</Option>
              <Option value="medium">Trung bình</Option>
              <Option value="high">Cao</Option>
            </Select>
          </div>

          <div>
            <Text>Hạn chót</Text>
            <DatePicker
              className="w-full"
              value={deadline}
              onChange={(date) => date && setDeadline(date)}
              format="DD/MM/YYYY"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default TaskManager 