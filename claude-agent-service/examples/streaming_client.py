"""
Claude Agent Service - 流式客户端示例

演示如何处理完整的流式响应,包括文本、工具调用和工具结果
"""

import requests
import json
from typing import Generator


class StreamingChatClient:
    """流式聊天客户端"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url

    def create_session(self, workspace_name: str = None) -> dict:
        """创建会话"""
        url = f"{self.base_url}/api/sessions"
        data = {}
        if workspace_name:
            data["workspace_name"] = workspace_name

        response = requests.post(url, json=data)
        response.raise_for_status()
        return response.json()

    def chat_stream(self, session_id: str, message: str) -> Generator[dict, None, None]:
        """流式聊天"""
        url = f"{self.base_url}/api/chat/stream"
        data = {
            "session_id": session_id,
            "message": message
        }

        response = requests.post(
            url,
            json=data,
            stream=True,
            headers={"Accept": "text/event-stream"},
            timeout=(30, 600)  # 连接超时30秒,读取超时600秒
        )
        response.raise_for_status()

        for line in response.iter_lines():
            if not line:
                continue

            line = line.decode('utf-8')
            if line.startswith('data: '):
                event = json.loads(line[6:])
                yield event

    def display_chat(self, session_id: str, message: str):
        """完整显示聊天过程"""
        print("=" * 70)
        print(f"💬 User: {message}")
        print("=" * 70)
        print()

        current_tool = None
        tool_input_buffer = ""

        for event in self.chat_stream(session_id, message):
            event_type = event.get("type")

            # ===== 文本增量 =====
            if event_type == "text_delta":
                content = event["content"]
                print(content, end="", flush=True)

            # ===== 内容块开始 =====
            elif event_type == "content_block_start":
                block_type = event.get("block_type")

                if block_type == "text":
                    # 文本块开始
                    if current_tool:
                        # 在工具调用后,开始新的文本
                        print("\n\n🤖 Claude: ", end="", flush=True)
                        current_tool = None
                    else:
                        print("🤖 Claude: ", end="", flush=True)

                elif block_type == "tool_use":
                    # 工具调用开始
                    tool = event.get("tool", {})
                    current_tool = {
                        "id": tool.get("id"),
                        "name": tool.get("name"),
                        "input": None,
                        "result": None
                    }
                    tool_input_buffer = ""

                    print("\n")
                    print("─" * 70)
                    print(f"🔧 Tool Call: {current_tool['name']}")
                    print("─" * 70)
                    print("   Building parameters", end="", flush=True)

            # ===== 工具参数流式输入 =====
            elif event_type == "tool_input_delta":
                tool_input_buffer += event["partial_json"]
                print(".", end="", flush=True)

            # ===== 工具调用完成 =====
            elif event_type == "tool_use":
                tool = event["tool"]
                current_tool["input"] = tool["input"]

                print(" ✓")
                print()
                print(f"   📋 Parameters:")
                for key, value in tool["input"].items():
                    if isinstance(value, str) and len(value) > 100:
                        value = value[:100] + "..."
                    print(f"      • {key}: {value}")
                print()
                print(f"   ⏳ Status: Executing...")

            # ===== 工具执行结果 =====
            elif event_type == "tool_result":
                content = event["content"]
                is_error = event["is_error"]

                if is_error:
                    print(f"   ❌ Status: Failed")
                    print(f"   📛 Error:")
                    print(f"      {content}")
                else:
                    print(f"   ✅ Status: Success")
                    print(f"   📄 Output:")

                    # 处理输出显示
                    lines = content.split('\n')
                    max_lines = 30

                    if len(lines) <= max_lines:
                        for line in lines:
                            print(f"      {line}")
                    else:
                        # 显示前面部分
                        for line in lines[:max_lines]:
                            print(f"      {line}")
                        print(f"      ... ({len(lines) - max_lines} more lines)")

                print("─" * 70)

            # ===== 系统消息 =====
            elif event_type == "system":
                if event.get("subtype") == "init":
                    claude_session = event["data"]["session_id"]
                    print(f"🔗 Claude Session: {claude_session}")
                    print()

            # ===== 统计信息 =====
            elif event_type == "result":
                data = event["data"]
                print("\n")
                print("=" * 70)
                print("📊 Statistics")
                print("=" * 70)
                print(f"   💰 Cost:     ${data['total_cost_usd']:.4f}")
                print(f"   ⏱  Duration: {data['duration_ms']}ms ({data['duration_ms']/1000:.1f}s)")
                print(f"   🔄 Turns:    {data['num_turns']}")

                usage = data['usage']
                print(f"   📝 Tokens:")
                print(f"      • Input:  {usage['input_tokens']}")
                print(f"      • Output: {usage['output_tokens']}")
                if usage.get('cache_read_input_tokens'):
                    print(f"      • Cached: {usage['cache_read_input_tokens']}")
                print("=" * 70)

            # ===== 完成 =====
            elif event_type == "done":
                print("\n✓ Conversation completed\n")
                break


def example_1_simple_text():
    """示例1: 简单文本对话"""
    print("\n" + "🎯 Example 1: Simple Text Conversation".center(70, "="))
    print()

    client = StreamingChatClient()

    # 创建会话
    session = client.create_session(workspace_name="demo-1")
    print(f"✓ Session created: {session['id']}\n")

    # 发送消息
    client.display_chat(session["id"], "介绍一下你自己")


def example_2_tool_calling():
    """示例2: 工具调用"""
    print("\n" + "🎯 Example 2: Tool Calling".center(70, "="))
    print()

    client = StreamingChatClient()

    # 创建会话
    session = client.create_session(workspace_name="demo-2")
    print(f"✓ Session created: {session['id']}\n")

    # 发送消息
    client.display_chat(session["id"], "帮我创建一个 hello.txt 文件,内容是 'Hello World'")


def example_3_multiple_tools():
    """示例3: 多个工具调用"""
    print("\n" + "🎯 Example 3: Multiple Tool Calls".center(70, "="))
    print()

    client = StreamingChatClient()

    # 创建会话
    session = client.create_session(workspace_name="demo-3")
    print(f"✓ Session created: {session['id']}\n")

    # 发送消息
    client.display_chat(
        session["id"],
        "帮我创建一个 Python 项目,包含 main.py 和 requirements.txt,然后查看创建的文件"
    )


def example_4_context_continuation():
    """示例4: 上下文延续"""
    print("\n" + "🎯 Example 4: Context Continuation".center(70, "="))
    print()

    client = StreamingChatClient()

    # 创建会话
    session = client.create_session(workspace_name="demo-4")
    print(f"✓ Session created: {session['id']}\n")

    # 第一次对话
    client.display_chat(session["id"], "创建一个 test.txt 文件")

    # 第二次对话 - 自动恢复上下文
    print("\n" + "─" * 70)
    print("继续对话 (自动恢复上下文)")
    print("─" * 70 + "\n")

    client.display_chat(session["id"], "查看刚才创建的文件内容")


def main():
    """主函数"""
    print()
    print("╔" + "═" * 68 + "╗")
    print("║" + "Claude Agent Service - Streaming Client Examples".center(68) + "║")
    print("╚" + "═" * 68 + "╝")

    try:
        # 运行示例
        example_1_simple_text()
        input("\nPress Enter to continue to Example 2...")

        example_2_tool_calling()
        input("\nPress Enter to continue to Example 3...")

        example_3_multiple_tools()
        input("\nPress Enter to continue to Example 4...")

        example_4_context_continuation()

        print("\n" + "🎉 All examples completed!".center(70, "="))

    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Cannot connect to service")
        print("   Please start the service first:")
        print("   $ docker-compose up -d")
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")


if __name__ == "__main__":
    main()
