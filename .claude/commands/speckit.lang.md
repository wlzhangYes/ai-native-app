description: Switch Spec-Kit language between Chinese and English / 切换 Spec-Kit 语言（中英文）
User Input
$ARGUMENTS
Purpose
This command allows you to switch the output language for all /speckit.* commands between:

zh-CN: Simplified Chinese (简体中文)
en: English
Note: This is a configuration command that modifies the CLAUDE.md file to set the language preference for the project.

Outline
Parse user input from $ARGUMENTS:

If empty or status: Show current language configuration
If zh-CN, zh, cn, 中文: Switch to Simplified Chinese
If en, english, 英文: Switch to English
Otherwise: Show usage help
Read current CLAUDE.md file from project root:

Locate the configuration block between <!-- SPECKIT_LANG_CONFIG_START --> and <!-- SPECKIT_LANG_CONFIG_END -->
Extract current language setting
Perform the requested action:

View: Display current language and configuration details
Switch: Replace the configuration block with the new language settings
Update CLAUDE.md (if switching):

Replace the entire configuration block
Ensure UTF-8 encoding
Verify the update succeeded
Report result:

Confirm the language switch
Explain what this means for future commands
Provide usage examples
Configuration Blocks
Chinese (zh-CN) Configuration
<!-- SPECKIT_LANG_CONFIG_START -->
## Spec-Kit 语言配置

**当前语言**: `zh-CN` (简体中文)

### 执行规则（所有 speckit.* 命令必须遵守）

当执行任何 `/speckit.*` 命令时，必须严格遵守以下规则：

1. **语言要求**：
   - 所有输出内容必须使用**简体中文**
   - 包括：文档内容、标题、描述、注释、错误消息、交互问答
   - 保留必要的技术术语英文原文（如 Git, Markdown, API, JSON 等）
   - 示例：
     - ✅ 正确："创建用户认证 API 接口"
     - ❌ 错误："Create user authentication API endpoint"

2. **编码要求**：
   - 所有生成的文件必须使用 **UTF-8 编码**（无 BOM）
   - 确保终端输出、文件内容均为 UTF-8
   - 在写入文件前明确指定编码

3. **模板处理**：
   - 使用原有英文模板的结构
   - 将模板中的所有英文内容即时翻译为中文
   - 保留 Markdown 格式标记
   - 示例映射：
     - "Feature Specification" → "功能规格说明"
     - "User Stories" → "用户故事"
     - "Tasks" → "任务清单"
     - "Implementation Plan" → "实施计划"

4. **具体命令执行要求**：
   - `/speckit.specify`: 生成的 spec.md 所有章节标题、内容、注释全部使用中文
   - `/speckit.tasks`: 生成的 tasks.md 所有任务描述、阶段说明全部使用中文
   - `/speckit.plan`: 生成的 plan.md 所有技术规划、架构说明全部使用中文
   - `/speckit.clarify`: 提出的问题、选项、说明全部使用中文
   - `/speckit.implement`: 任务描述、进度输出、错误消息全部使用中文
   - `/speckit.analyze`: 分析报告、建议、总结全部使用中文
   - `/speckit.checklist`: 检查清单项、说明全部使用中文

5. **防止乱码措施**：
   - 在输出前确认使用 UTF-8 编码
   - 避免使用可能导致乱码的特殊字符
   - 在生成文件时使用 Write 工具并确保 UTF-8
   - 如遇到编码问题，重新生成文件

6. **质量标准**：
   - 中文表达自然流畅，符合中文习惯
   - 避免机器翻译的生硬感
   - 专业术语使用准确
   - 标点符号使用中文标点（，。！？）

### 切换语言

使用 `/speckit.lang <语言代码>` 命令切换：
- `zh-CN` 或 `zh` 或 `中文`: 切换为简体中文
- `en` 或 `english` 或 `英文`: 切换为英文
- 无参数或 `status`: 查看当前语言配置

### 示例

查看当前语言：
/speckit.lang


切换为中文：
/speckit.lang zh-CN


切换为英文：
/speckit.lang en

<!-- SPECKIT_LANG_CONFIG_END -->
English (en) Configuration
<!-- SPECKIT_LANG_CONFIG_START -->
## Spec-Kit Language Configuration

**Current Language**: `en` (English)

### Execution Rules (All speckit.* commands must follow)

When executing any `/speckit.*` command, strictly follow these rules:

1. **Language Requirement**:
   - All output content must use **English**
   - Including: document content, titles, descriptions, comments, error messages, interactive Q&A
   - Use clear, professional English

2. **Encoding Requirement**:
   - All generated files must use **UTF-8 encoding** (without BOM)
   - Ensure terminal output and file content are UTF-8
   - Explicitly specify encoding before writing files

3. **Template Processing**:
   - Use the original English template structure
   - Keep all content in English
   - Preserve Markdown formatting

4. **Specific Command Requirements**:
   - `/speckit.specify`: Generated spec.md uses English for all sections
   - `/speckit.tasks`: Generated tasks.md uses English for all task descriptions
   - `/speckit.plan`: Generated plan.md uses English for all technical planning
   - `/speckit.clarify`: Questions and options in English
   - `/speckit.implement`: Task descriptions and progress output in English
   - `/speckit.analyze`: Analysis reports in English
   - `/speckit.checklist`: Checklist items in English

5. **Encoding Safety**:
   - Confirm UTF-8 encoding before output
   - Use Write tool with UTF-8 encoding
   - Regenerate files if encoding issues occur

### Switch Language

Use `/speckit.lang <language-code>` to switch:
- `en` or `english`: Switch to English
- `zh-CN` or `zh` or `cn`: Switch to Simplified Chinese
- No arguments or `status`: View current language configuration

### Examples

View current language:
/speckit.lang


Switch to Chinese:
/speckit.lang zh-CN


Switch to English:
/speckit.lang en

<!-- SPECKIT_LANG_CONFIG_END -->
Implementation Steps
Step 1: Parse Arguments
Extract language code from $ARGUMENTS:

Normalize input: zh-CN, zh, cn, 中文 → zh-CN
Normalize input: en, english, 英文 → en
Empty or status → show current configuration
Step 2: Read CLAUDE.md
Read the CLAUDE.md file from the project root:

/Users/anker/Desktop/claude_test/eufy_sec_android_new/android/BatteryCam/CLAUDE.md
Look for the configuration block between markers:

Start marker: <!-- SPECKIT_LANG_CONFIG_START -->
End marker: <!-- SPECKIT_LANG_CONFIG_END -->
If markers are not found:

Report: "Language configuration block not found in CLAUDE.md"
Suggest: "Please add the configuration block first using /speckit.lang init"
Step 3: Execute Action
If action is VIEW (no arguments or status):

Extract current language from the configuration block
Display:
Current language setting
Configuration block content (abbreviated)
Available commands
If action is SWITCH:

Determine target language (zh-CN or en)
Select the appropriate configuration block (from templates above)
Replace the old configuration block with the new one
Write back to CLAUDE.md using Edit tool
If action is INIT (only if config block doesn't exist):

Use Chinese configuration as default
Append configuration block to the end of CLAUDE.md
Step 4: Verify and Report
After switching:

Re-read CLAUDE.md to verify the change
Confirm the language in the block matches the target
Report success in the NEW language:
For zh-CN: Use Chinese output
For en: Use English output
Output Messages
When viewing current language (Chinese is active)
✓ 当前 Spec-Kit 语言配置

语言: zh-CN (简体中文)

这意味着所有 /speckit.* 命令将使用简体中文输出，包括：
- 生成的文档内容（spec.md, tasks.md, plan.md 等）
- 与您的交互对话
- 错误消息和提示

要切换语言，请使用：
  /speckit.lang en      (切换为英文)
  /speckit.lang zh-CN   (保持中文)
When viewing current language (English is active)
✓ Current Spec-Kit Language Configuration

Language: en (English)

This means all /speckit.* commands will output in English, including:
- Generated documents (spec.md, tasks.md, plan.md, etc.)
- Interactive dialogues with you
- Error messages and prompts

To switch language, use:
  /speckit.lang zh-CN   (Switch to Chinese)
  /speckit.lang en      (Keep English)
When switching to Chinese
✓ 已成功切换为简体中文

从现在开始，所有 /speckit.* 命令将使用简体中文输出。

下次执行任何 speckit 命令时（如 /speckit.specify, /speckit.tasks 等），
所有内容都将自动使用中文生成。

示例：
  /speckit.specify "添加用户登录功能"
  → 将生成中文的 spec.md

配置已保存到 CLAUDE.md 文件中。
When switching to English
✓ Successfully switched to English

From now on, all /speckit.* commands will output in English.

The next time you run any speckit command (such as /speckit.specify, /speckit.tasks, etc.),
all content will be automatically generated in English.

Example:
  /speckit.specify "Add user login feature"
  → Will generate spec.md in English

Configuration saved to CLAUDE.md file.
Error Handling
If CLAUDE.md file not found
✗ 错误：找不到 CLAUDE.md 文件

请确保在项目根目录执行此命令，或检查 CLAUDE.md 文件是否存在。

文件路径：/Users/anker/Desktop/claude_test/eufy_sec_android_new/android/BatteryCam/CLAUDE.md
If configuration block not found
✗ 错误：CLAUDE.md 中未找到语言配置区块

请使用以下命令初始化配置：
  /speckit.lang init

或者手动在 CLAUDE.md 中添加配置区块。
If invalid language code
✗ 无效的语言代码：<用户输入>

支持的语言代码：
  - zh-CN, zh, cn, 中文  (简体中文)
  - en, english, 英文     (英文)

示例：
  /speckit.lang zh-CN
  /speckit.lang en
Notes
This command modifies the CLAUDE.md file in the project root
The language setting is project-wide and affects all team members
The configuration is stored in version control, so it syncs across the team
No other spec-kit files are modified - this is a zero-intrusion approach
The language setting takes effect immediately for all subsequent commands