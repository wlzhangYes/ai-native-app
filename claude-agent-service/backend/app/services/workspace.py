"""
Workspace management service
"""
import json
import shutil
from pathlib import Path
from typing import Optional
import aiofiles

from app.core.config import settings


class WorkspaceService:
    """Workspace management service"""

    def __init__(self):
        self.workspace_root = Path(settings.WORKSPACE_ROOT)
        self.workspace_root.mkdir(parents=True, exist_ok=True)

    def get_workspace_path(self, session_id: str, workspace_name: Optional[str] = None) -> Path:
        """Get workspace path for session"""
        name = workspace_name or session_id
        return self.workspace_root / name

    async def create_workspace(self, session_id: str, workspace_name: Optional[str] = None) -> Path:
        """Create workspace directory"""
        workspace_path = self.get_workspace_path(session_id, workspace_name)

        if workspace_path.exists():
            raise ValueError(f"Workspace {workspace_path.name} already exists")

        workspace_path.mkdir(parents=True, exist_ok=True)

        # Initialize Claude Code configuration
        await self._initialize_claude_config(workspace_path)

        return workspace_path

    async def delete_workspace(self, workspace_path: Path) -> bool:
        """Delete workspace directory"""
        if workspace_path.exists():
            shutil.rmtree(workspace_path)
            return True
        return False

    async def _initialize_claude_config(self, workspace_path: Path):
        """Initialize Claude Code configuration"""
        # Create .claude directory
        claude_dir = workspace_path / ".claude"
        claude_dir.mkdir(parents=True, exist_ok=True)

        # Create commands directory
        commands_dir = claude_dir / "commands"
        commands_dir.mkdir(parents=True, exist_ok=True)

        # Create SpecKit command files
        from app.utils.claude_templates import SPECKIT_COMMANDS, DEFAULT_SETTINGS

        for filename, content in SPECKIT_COMMANDS.items():
            command_file = commands_dir / filename
            async with aiofiles.open(command_file, 'w') as f:
                await f.write(content)

        # Create settings.local.json
        settings_file = claude_dir / "settings.local.json"
        async with aiofiles.open(settings_file, 'w') as f:
            await f.write(json.dumps(DEFAULT_SETTINGS, indent=2))

        # Create README
        readme_file = workspace_path / "README.md"
        async with aiofiles.open(readme_file, 'w') as f:
            await f.write(f"""# Claude Agent Workspace

This workspace is managed by Claude Agent Service.

## Available SpecKit Commands

- `/speckit.analyze` - Analyze specification consistency
- `/speckit.clarify` - Clarify requirements
- `/speckit.implement` - Execute implementation
- `/speckit.specify` - Create/update specifications
- `/speckit.checklist` - Generate feature checklist
- `/speckit.constitution` - Manage project constitution
- `/speckit.plan` - Create implementation plan
- `/speckit.tasks` - Generate task list

## Configuration

Configuration files are located in `.claude/` directory.
""")


# Global workspace service instance
workspace_service = WorkspaceService()
