'use client'

import { TOOL_GROUPS } from '@/lib/constants'

interface ToolSelectorProps {
  selectedTools: Set<string>
  onToggle: (toolId: string) => void
}

interface ToolGroup {
  name: string
  tools: typeof TOOL_GROUPS[number][]
}

function groupToolsByCategory(): ToolGroup[] {
  const groups: ToolGroup[] = []
  let currentGroup = ''

  for (const tool of TOOL_GROUPS) {
    if (tool.group !== currentGroup) {
      currentGroup = tool.group
      groups.push({ name: currentGroup, tools: [] })
    }
    groups[groups.length - 1].tools.push(tool)
  }

  return groups
}

const GROUPED_TOOLS = groupToolsByCategory()

function ToolSelector({ selectedTools, onToggle }: ToolSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
        Инструменты
      </span>
      <div className="flex flex-col gap-3">
        {GROUPED_TOOLS.map((group) => (
          <div key={group.name} className="flex flex-col gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted/50">
              {group.name}
            </span>
            {group.tools.map((tool) => (
              <label
                key={tool.id}
                className="border-primary/12 flex cursor-pointer items-start gap-3 rounded-xl border bg-accent px-3 py-2 text-sm text-muted transition-colors hover:border-primary/25 hover:text-white"
              >
                <input
                  type="checkbox"
                  checked={selectedTools.has(tool.id)}
                  onChange={() => onToggle(tool.id)}
                  className="size-5 shrink-0 rounded accent-brand"
                />
                <div className="flex flex-col gap-0.5">
                  <span>{tool.label}</span>
                  <span className="text-xs leading-tight text-muted/50">
                    {tool.description}
                  </span>
                </div>
              </label>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ToolSelector
