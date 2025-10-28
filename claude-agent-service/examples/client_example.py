"""
Claude Agent Service - Python Client Example

演示如何使用 Python 客户端调用 Claude Agent Service API
"""

import requests
import json
import time


class ClaudeAgentClient:
    """Claude Agent Service 客户端"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session_id = None

    def create_session(self, session_id: str = None, workspace_name: str = None) -> dict:
        """创建会话"""
        url = f"{self.base_url}/api/sessions"
        data = {}
        if session_id:
            data["session_id"] = session_id
        if workspace_name:
            data["workspace_name"] = workspace_name

        response = requests.post(url, json=data)
        response.raise_for_status()

        session_data = response.json()
        self.session_id = session_data["session_id"]
        return session_data

    def list_sessions(self) -> list:
        """列出所有会话"""
        url = f"{self.base_url}/api/sessions"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()

    def get_session(self, session_id: str = None) -> dict:
        """获取会话信息"""
        sid = session_id or self.session_id
        if not sid:
            raise ValueError("No session_id provided")

        url = f"{self.base_url}/api/sessions/{sid}"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()

    def delete_session(self, session_id: str = None) -> dict:
        """删除会话"""
        sid = session_id or self.session_id
        if not sid:
            raise ValueError("No session_id provided")

        url = f"{self.base_url}/api/sessions/{sid}"
        response = requests.delete(url)
        response.raise_for_status()
        return response.json()

    def chat_stream(self, message: str, session_id: str = None,
                   permission_mode: str = "acceptEdits",
                   resume: str = None, max_turns: int = None):
        """流式聊天"""
        sid = session_id or self.session_id

        url = f"{self.base_url}/api/chat/stream"
        data = {
            "message": message,
            "permission_mode": permission_mode
        }

        if sid:
            data["session_id"] = sid
        if resume:
            data["resume"] = resume
        if max_turns:
            data["max_turns"] = max_turns

        response = requests.post(
            url,
            json=data,
            stream=True,
            headers={"Accept": "text/event-stream"}
        )
        response.raise_for_status()

        # 处理流式响应
        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith('data: '):
                    data = json.loads(line[6:])
                    yield data

    def health_check(self) -> dict:
        """健康检查"""
        url = f"{self.base_url}/health"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()


def example_basic_usage():
    """基础使用示例"""
    print("=" * 60)
    print("示例 1: 基础使用")
    print("=" * 60)

    client = ClaudeAgentClient()

    # 1. 创建会话
    print("\n1. 创建会话...")
    session = client.create_session()
    print(f"   会话ID: {session['session_id']}")
    print(f"   工作空间: {session['workspace_path']}")

    # 2. 发送聊天请求
    print("\n2. 发送聊天请求...")
    print("   用户: 帮我创建一个 hello.txt 文件,内容是 'Hello, Claude Agent!'")
    print("\n   Claude: ", end="", flush=True)

    for event in client.chat_stream("帮我创建一个 hello.txt 文件,内容是 'Hello, Claude Agent!'"):
        if event["type"] == "text":
            print(event["content"], end="", flush=True)
        elif event["type"] == "done":
            print("\n\n   完成!")
            break
        elif event["type"] == "error":
            print(f"\n   错误: {event['error']}")
            break

    # 3. 查看会话信息
    print("\n3. 查看会话信息...")
    session_info = client.get_session()
    print(f"   对话次数: {session_info['conversation_count']}")
    print(f"   最后活动: {session_info['last_activity']}")


def example_multiple_conversations():
    """多次对话示例"""
    print("\n" + "=" * 60)
    print("示例 2: 多次对话")
    print("=" * 60)

    client = ClaudeAgentClient()

    # 创建会话
    print("\n创建会话...")
    session = client.create_session(workspace_name="demo-project")
    print(f"会话ID: {session['session_id']}")

    conversations = [
        "创建一个 Python 项目结构,包含 main.py 和 requirements.txt",
        "在 main.py 中写一个简单的 FastAPI 应用",
        "添加一个 /hello 接口,返回 'Hello World'"
    ]

    for i, message in enumerate(conversations, 1):
        print(f"\n--- 对话 {i} ---")
        print(f"用户: {message}")
        print("Claude: ", end="", flush=True)

        for event in client.chat_stream(message):
            if event["type"] == "text":
                print(event["content"], end="", flush=True)
            elif event["type"] == "done":
                print("\n")
                break

        time.sleep(1)  # 稍微等待一下


def example_session_management():
    """会话管理示例"""
    print("\n" + "=" * 60)
    print("示例 3: 会话管理")
    print("=" * 60)

    client = ClaudeAgentClient()

    # 创建多个会话
    print("\n1. 创建多个会话...")
    sessions = []
    for i in range(3):
        session = client.create_session(workspace_name=f"project-{i+1}")
        sessions.append(session)
        print(f"   会话 {i+1}: {session['session_id']}")

    # 列出所有会话
    print("\n2. 列出所有会话...")
    all_sessions = client.list_sessions()
    print(f"   总会话数: {all_sessions['total']}")
    for s in all_sessions['sessions']:
        print(f"   - {s['session_id']}: {s['workspace_path']}")

    # 删除会话
    print("\n3. 删除第一个会话...")
    result = client.delete_session(sessions[0]['session_id'])
    print(f"   {result['message']}")

    # 再次列出会话
    print("\n4. 再次列出会话...")
    all_sessions = client.list_sessions()
    print(f"   剩余会话数: {all_sessions['total']}")


def example_speckit_commands():
    """SpecKit 命令示例"""
    print("\n" + "=" * 60)
    print("示例 4: 使用 SpecKit 命令")
    print("=" * 60)

    client = ClaudeAgentClient()

    # 创建会话
    session = client.create_session(workspace_name="feature-dev")
    print(f"会话ID: {session['session_id']}")

    # 使用 SpecKit 命令
    commands = [
        "/speckit.specify 创建一个用户认证功能,支持邮箱和密码登录",
        "/speckit.tasks",
        "/speckit.plan"
    ]

    for cmd in commands:
        print(f"\n执行命令: {cmd}")
        print("响应: ", end="", flush=True)

        for event in client.chat_stream(cmd):
            if event["type"] == "text":
                print(event["content"], end="", flush=True)
            elif event["type"] == "done":
                print("\n")
                break

        time.sleep(1)


def main():
    """主函数"""
    print("Claude Agent Service - 客户端示例\n")

    try:
        # 检查服务健康状态
        client = ClaudeAgentClient()
        health = client.health_check()
        print(f"服务状态: {health['status']}")
        print(f"当前会话数: {health['sessions']}\n")

        # 运行示例
        example_basic_usage()
        example_multiple_conversations()
        example_session_management()
        example_speckit_commands()

        print("\n" + "=" * 60)
        print("所有示例完成!")
        print("=" * 60)

    except requests.exceptions.ConnectionError:
        print("错误: 无法连接到服务,请确保服务已启动")
        print("运行: docker-compose up 或 python -m app.main")
    except Exception as e:
        print(f"错误: {e}")


if __name__ == "__main__":
    main()
