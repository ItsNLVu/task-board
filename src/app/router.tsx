import { createBrowserRouter } from 'react-router'
import { BoardPage } from '@/features/board/BoardPage'
import { TaskModalRoute } from '@/features/task/TaskModalRoute'
import { RouteError } from './RouteError'

export function createRouter() {
  return createBrowserRouter([
    {
      path: '/',
      element: <BoardPage />,
      errorElement: <RouteError />,
      children: [
        { path: 'tasks/new', element: <TaskModalRoute mode="create" /> },
        { path: 'tasks/:taskId', element: <TaskModalRoute mode="edit" /> },
      ],
    },
  ])
}
