"""
Chat API endpoints
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from claude_agent_sdk import (
    ClaudeSDKClient,
    ClaudeAgentOptions,
    AssistantMessage,
    TextBlock,
    ToolUseBlock,
    ResultMessage,
    SystemMessage,
    UserMessage,
    ToolResultBlock
)

# Try to import StreamEvent, it might not be available in all SDK versions
try:
    from claude_agent_sdk import StreamEvent
    HAS_STREAM_EVENT = True
except ImportError:
    StreamEvent = None
    HAS_STREAM_EVENT = False

from app.core.database import get_db
from app.core.config import settings
from app.services.session import session_service
from app.schemas.chat import ChatRequest

router = APIRouter(prefix="/api/chat", tags=["chat"])


def get_claude_env() -> dict:
    """Get Claude environment variables"""
    return {
        'ANTHROPIC_BEDROCK_BASE_URL': settings.ANTHROPIC_BEDROCK_BASE_URL,
        'CLAUDE_CODE_SKIP_BEDROCK_AUTH': settings.CLAUDE_CODE_SKIP_BEDROCK_AUTH,
        'CLAUDE_CODE_USE_BEDROCK': settings.CLAUDE_CODE_USE_BEDROCK,
        'ANTHROPIC_AUTH_TOKEN': settings.ANTHROPIC_AUTH_TOKEN,
        'ANTHROPIC_SMALL_FAST_MODEL': settings.ANTHROPIC_SMALL_FAST_MODEL,
        'ANTHROPIC_MODEL': settings.ANTHROPIC_MODEL
    }


def get_claude_options(workspace_path: str, permission_mode: str = "acceptEdits",
                      claude_session_id: str = None, max_turns: int = None) -> ClaudeAgentOptions:
    """Get Claude Agent options"""
    from pathlib import Path

    settings_path = str(Path(workspace_path) / ".claude" / "settings.local.json")

    options = ClaudeAgentOptions(
        env=get_claude_env(),
        cwd=workspace_path,
        permission_mode=permission_mode,
        system_prompt={
            "type": "preset",
            "preset": "claude_code"
        },
        setting_sources=['project'],
        settings=settings_path,
        include_partial_messages=True  # Enable streaming
    )

    # Use Claude session ID to resume conversation
    if claude_session_id:
        options.resume = claude_session_id

    if max_turns:
        options.max_turns = max_turns

    return options


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """Stream chat responses from Claude Agent"""

    # Get or create session
    session_id = request.session_id
    if not session_id:
        # Auto-create session
        session = await session_service.create_session(db)
        await db.commit()
        session_id = session.id
    else:
        session = await session_service.get_session(db, session_id)
        if not session:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

    # Create conversation record
    conversation = await session_service.create_conversation(
        db=db,
        session_id=session_id,
        user_message=request.message,
        permission_mode=request.permission_mode or "acceptEdits",
        resume_id=request.resume,
        max_turns=request.max_turns
    )
    await db.commit()

    conversation_id = conversation.id
    workspace_path = session.workspace_path

    async def generate():
        """Generate streaming response"""
        import logging
        logger = logging.getLogger(__name__)

        collected_response = []
        claude_session_id_from_sdk = None
        tool_calls_history = []  # Store all tool calls with results
        full_response_from_result = ""  # Store text from ResultMessage

        try:
            logger.info(f"Starting stream for session {session_id}, message: {request.message[:50]}...")

            # Send initial connection event
            yield f"data: {json.dumps({'type': 'connected', 'session_id': session_id})}\n\n"
            # Get Claude options - use existing Claude session ID if available
            options = get_claude_options(
                workspace_path=workspace_path,
                permission_mode=request.permission_mode or "acceptEdits",
                claude_session_id=session.claude_session_id or request.resume,
                max_turns=request.max_turns
            )

            # Create Claude client
            logger.info("Creating Claude SDK client...")
            async with ClaudeSDKClient(options=options) as client:
                # Send query
                logger.info("Sending query to Claude...")
                await client.query(request.message)
                logger.info("Query sent, waiting for response...")

                # Stream responses
                async for message in client.receive_response():
                    # Handle StreamEvent for real-time streaming
                    if HAS_STREAM_EVENT and StreamEvent and isinstance(message, StreamEvent):
                        event = message.event
                        event_type = event.get("type")

                        # Stream text deltas in real-time
                        if event_type == "content_block_delta":
                            delta = event.get("delta", {})

                            # Text delta
                            if delta.get("type") == "text_delta":
                                text_chunk = delta.get("text", "")
                                collected_response.append(text_chunk)

                                # Send streaming text chunk
                                event_data = {
                                    "type": "text_delta",
                                    "content": text_chunk,
                                    "session_id": session_id,
                                    "conversation_id": conversation_id
                                }
                                yield f"data: {json.dumps(event_data)}\n\n"

                            # Tool input delta (工具调用参数的流式输入)
                            elif delta.get("type") == "input_json_delta":
                                partial_json = delta.get("partial_json", "")
                                event_data = {
                                    "type": "tool_input_delta",
                                    "partial_json": partial_json,
                                    "session_id": session_id,
                                    "conversation_id": conversation_id
                                }
                                yield f"data: {json.dumps(event_data)}\n\n"

                        # Content block start (文本或工具调用开始)
                        elif event_type == "content_block_start":
                            content_block = event.get("content_block", {})
                            block_type = content_block.get("type")

                            event_data = {
                                "type": "content_block_start",
                                "block_type": block_type,
                                "index": event.get("index"),
                                "session_id": session_id,
                                "conversation_id": conversation_id
                            }

                            # 如果是工具调用,包含工具信息
                            if block_type == "tool_use":
                                event_data["tool"] = {
                                    "id": content_block.get("id"),
                                    "name": content_block.get("name")
                                }

                            yield f"data: {json.dumps(event_data)}\n\n"

                        # Send other stream events
                        elif event_type in ["message_start", "content_block_stop", "message_delta", "message_stop"]:
                            event_data = {
                                "type": "stream_event",
                                "event_type": event_type,
                                "data": event,
                                "session_id": session_id,
                                "conversation_id": conversation_id
                            }
                            yield f"data: {json.dumps(event_data)}\n\n"

                    # Handle complete AssistantMessage
                    elif isinstance(message, AssistantMessage):
                        for block in message.content:
                            # Tool use block (工具调用完成)
                            if isinstance(block, ToolUseBlock):
                                # Store tool call
                                tool_call_record = {
                                    "id": block.id,
                                    "name": block.name,
                                    "input": block.input,
                                    "result": None,
                                    "is_error": False
                                }
                                tool_calls_history.append(tool_call_record)

                                event_data = {
                                    "type": "tool_use",
                                    "tool": {
                                        "id": block.id,
                                        "name": block.name,
                                        "input": block.input
                                    },
                                    "session_id": session_id,
                                    "conversation_id": conversation_id
                                }
                                yield f"data: {json.dumps(event_data)}\n\n"

                            # Text block (完整文本,通常已通过 delta 发送)
                            elif isinstance(block, TextBlock):
                                # Text already streamed via deltas
                                pass

                    # Handle UserMessage (工具执行结果)
                    elif isinstance(message, UserMessage):
                        for block in message.content:
                            if isinstance(block, ToolResultBlock):
                                # Update tool call with result
                                for tool_call in tool_calls_history:
                                    if tool_call["id"] == block.tool_use_id:
                                        tool_call["result"] = block.content
                                        tool_call["is_error"] = block.is_error
                                        break

                                event_data = {
                                    "type": "tool_result",
                                    "tool_use_id": block.tool_use_id,
                                    "content": block.content,
                                    "is_error": block.is_error,
                                    "session_id": session_id,
                                    "conversation_id": conversation_id
                                }
                                yield f"data: {json.dumps(event_data)}\n\n"

                    # Handle ResultMessage
                    elif isinstance(message, ResultMessage):
                        # Store the complete response text
                        full_response_from_result = message.result

                        # Send result message
                        event_data = {
                            "type": "result",
                            "data": {
                                "subtype": message.subtype,
                                "is_error": message.is_error,
                                "duration_ms": message.duration_ms,
                                "total_cost_usd": message.total_cost_usd,
                                "num_turns": message.num_turns,
                                "usage": message.usage,
                                "result": message.result
                            },
                            "session_id": session_id,
                            "conversation_id": conversation_id
                        }
                        yield f"data: {json.dumps(event_data)}\n\n"

                    # Handle SystemMessage
                    elif isinstance(message, SystemMessage):
                        # Capture Claude session ID from system message
                        if message.subtype == "init" and message.data:
                            claude_session_id_from_sdk = message.data.get("session_id")

                        # Send system message
                        event_data = {
                            "type": "system",
                            "subtype": message.subtype,
                            "data": message.data,
                            "session_id": session_id,
                            "conversation_id": conversation_id
                        }
                        yield f"data: {json.dumps(event_data)}\n\n"

            # Update conversation with response
            # Use ResultMessage.result if no streaming text was collected
            full_response = "".join(collected_response) if collected_response else full_response_from_result

            logger.info(f"Saving response: {len(full_response)} chars, {len(tool_calls_history)} tool calls")

            # Use a new database session from the same engine
            from app.core.database import AsyncSessionLocal
            async with AsyncSessionLocal() as update_db:
                try:
                    await session_service.update_conversation_response(
                        update_db,
                        conversation_id,
                        full_response,
                        tool_calls=tool_calls_history  # Save tool calls
                    )
                    # Update session activity and Claude session ID mapping
                    await session_service.update_session_activity(
                        update_db,
                        session_id,
                        increment_conversation=True,
                        claude_session_id=claude_session_id_from_sdk
                    )
                    await update_db.commit()
                except Exception as update_error:
                    logger.error(f"Failed to update conversation: {update_error}")
                    await update_db.rollback()

            # Send completion event with Claude session ID
            completion_data = {
                'type': 'done',
                'session_id': session_id,
                'conversation_id': conversation_id,
                'claude_session_id': claude_session_id_from_sdk
            }
            yield f"data: {json.dumps(completion_data)}\n\n"

        except Exception as e:
            # Log error
            logger.error(f"Stream error: {e}", exc_info=True)

            # If error is related to session not found, clear the saved claude_session_id
            error_msg = str(e)
            if "No conversation found" in error_msg or "session" in error_msg.lower():
                logger.warning(f"Claude session may be expired, clearing saved session ID")
                # Clear the invalid claude_session_id
                from app.core.database import AsyncSessionLocal
                async with AsyncSessionLocal() as clear_db:
                    try:
                        await session_service.update_session_activity(
                            clear_db,
                            session_id,
                            increment_conversation=False,
                            claude_session_id=None  # Clear invalid session ID
                        )
                        await clear_db.commit()
                        logger.info("Cleared invalid Claude session ID")
                    except:
                        pass

            # Send error event
            error_data = {
                "type": "error",
                "error": str(e),
                "detail": str(type(e).__name__),
                "session_id": session_id,
                "conversation_id": conversation_id,
                "suggestion": "Claude session may be expired. Please try again with a new message."
            }
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
