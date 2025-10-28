// TodoThoughtChain Component - Display TodoWrite todos as ThoughtChain
// 平铺任务列表使用 ThoughtChain 展示，更符合 AI 执行流程的视觉效果

import { CheckCircleOutlined, LoadingOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ThoughtChainItem } from '@ant-design/x';
import { ThoughtChain } from '@ant-design/x';
import type { Todo } from '@/types/models';

/**
 * 获取任务状态对应的图标
 * 不使用 Tailwind className，保持与 Ant Design X 的样式兼容性
 */
function getStatusIcon(status: Todo['status']) {
  switch (status) {
    case 'completed':
      return <CheckCircleOutlined />;
    case 'in_progress':
      return <LoadingOutlined />;
    case 'pending':
      return <LoadingOutlined />; // pending 也显示加载图标
    default:
      return <CloseCircleOutlined />;
  }
}

/**
 * 将 TodoWrite 状态映射到 ThoughtChain 状态
 */
function mapTodoStatus(status: Todo['status']): ThoughtChainItem['status'] {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'pending'; // ThoughtChain 的 pending 表示进行中（带动画）
    case 'pending':
      return 'pending';
    default:
      return 'error';
  }
}

interface TodoThoughtChainProps {
  todos: Todo[];
  onTaskClick?: (todoIndex: number) => void;
}

/**
 * TodoThoughtChain 组件
 * 使用 Ant Design X 的 ThoughtChain 组件展示平铺的 TodoWrite 任务列表
 *
 * 使用场景：
 * - AI Agent 生成的平铺任务列表
 * - 线性执行流程
 * - 实时展示任务执行状态
 *
 * 优势：
 * - 视觉上更符合 AI 执行步骤
 * - 自带状态动画和图标
 * - 简洁清晰，无需层级包装
 */
export function TodoThoughtChain({ todos, onTaskClick }: TodoThoughtChainProps) {
  // 将 todos 转换为 ThoughtChain items
  const items: ThoughtChainItem[] = todos.map((todo, index) => {
    const status = mapTodoStatus(todo.status);
    const icon = getStatusIcon(todo.status);

    console.log(`[TodoThoughtChain] Item ${index}:`, {
      title: todo.content,
      status,
      icon: !!icon,
      todoStatus: todo.status,
    });

    return {
      title: todo.content,
      // 如果任务进行中且 activeForm 不同，显示为 description
      description:
        todo.status === 'in_progress' && todo.activeForm !== todo.content
          ? todo.activeForm
          : undefined,
      status,
      icon,
    };
  });

  return (
    <div className="p-4">
      {todos.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          暂无任务
        </div>
      ) : (
        <>
          <div className="mb-2 text-sm text-gray-500">
            AI 任务列表 ({todos.length} 个任务)
          </div>
          <ThoughtChain items={items} />
        </>
      )}
    </div>
  );
}
