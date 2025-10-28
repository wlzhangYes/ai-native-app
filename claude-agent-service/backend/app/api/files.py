"""
File browser API endpoints
"""
import os
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.services.session import session_service

router = APIRouter(prefix="/api/sessions/{session_id}/files", tags=["files"])


class FileItem(BaseModel):
    """File or directory item"""
    name: str
    path: str
    type: str  # "file" or "directory"
    size: Optional[int] = None
    modified: Optional[str] = None


class FileListResponse(BaseModel):
    """File list response"""
    files: List[FileItem]
    path: str
    total: int


class FileContentResponse(BaseModel):
    """File content response"""
    path: str
    content: str
    size: int


def is_ignored(path: Path) -> bool:
    """Check if path should be ignored"""
    ignored_names = {
        '.git', '.svn', '.hg', '__pycache__', 'node_modules',
        '.DS_Store', '.pytest_cache', '.mypy_cache', '.tox',
        'venv', '.venv', 'env', '.env', 'dist', 'build',
        '*.pyc', '*.pyo', '*.pyd', '.Python'
    }

    name = path.name
    # Check exact matches
    if name in ignored_names:
        return True
    # Check if it starts with a dot (hidden files, but allow specific files)
    if name.startswith('.') and name not in {'.claude', '.gitignore', '.dockerignore'}:
        return True
    return False


def get_relative_path(full_path: Path, workspace_path: Path) -> str:
    """Get relative path from workspace"""
    try:
        return str(full_path.relative_to(workspace_path))
    except ValueError:
        return full_path.name


@router.get("", response_model=FileListResponse)
async def list_files(
    session_id: str,
    path: str = Query("/", description="Relative path within workspace"),
    db: AsyncSession = Depends(get_db)
):
    """
    List files and directories in workspace

    Returns a flat list of files/directories for the specified path.
    """
    # Get session
    session = await session_service.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

    workspace_path = Path(session.workspace_path)

    # Resolve requested path
    if path == "/" or path == "":
        target_path = workspace_path
    else:
        # Remove leading slash if present
        clean_path = path.lstrip("/")
        target_path = workspace_path / clean_path

    # Security check: ensure path is within workspace
    try:
        target_path = target_path.resolve()
        target_path.relative_to(workspace_path.resolve())
    except (ValueError, RuntimeError):
        raise HTTPException(
            status_code=403,
            detail="Access denied: path is outside workspace"
        )

    if not target_path.exists():
        raise HTTPException(status_code=404, detail=f"Path not found: {path}")

    if not target_path.is_dir():
        raise HTTPException(status_code=400, detail=f"Path is not a directory: {path}")

    # List files and directories
    files: List[FileItem] = []

    try:
        for item in sorted(target_path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower())):
            # Skip ignored files
            if is_ignored(item):
                continue

            try:
                stat = item.stat()
                rel_path = get_relative_path(item, workspace_path)

                files.append(FileItem(
                    name=item.name,
                    path=rel_path,
                    type="directory" if item.is_dir() else "file",
                    size=stat.st_size if item.is_file() else None,
                    modified=str(stat.st_mtime) if stat else None
                ))
            except (OSError, PermissionError):
                # Skip files that can't be accessed
                continue

    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")

    return FileListResponse(
        files=files,
        path=path,
        total=len(files)
    )


@router.get("/content", response_model=FileContentResponse)
async def get_file_content(
    session_id: str,
    path: str = Query(..., description="Relative file path within workspace"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get file content

    Returns the text content of the specified file.
    Binary files will return an error.
    """
    # Get session
    session = await session_service.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

    workspace_path = Path(session.workspace_path)

    # Resolve file path (remove leading slash)
    clean_path = path.lstrip("/")
    file_path = workspace_path / clean_path

    # Security check: ensure path is within workspace
    try:
        file_path = file_path.resolve()
        file_path.relative_to(workspace_path.resolve())
    except (ValueError, RuntimeError):
        raise HTTPException(
            status_code=403,
            detail="Access denied: path is outside workspace"
        )

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {path}")

    if not file_path.is_file():
        raise HTTPException(status_code=400, detail=f"Path is not a file: {path}")

    # Check file size (limit to 1MB for preview)
    max_size = 1024 * 1024  # 1MB
    file_size = file_path.stat().st_size

    if file_size > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large for preview: {file_size} bytes (max {max_size})"
        )

    # Try to read as text
    try:
        content = file_path.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="File is not a text file (binary content detected)"
        )
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")

    return FileContentResponse(
        path=path,
        content=content,
        size=file_size
    )
