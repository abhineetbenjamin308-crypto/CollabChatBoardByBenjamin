import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useAIStore } from '@/stores/ai'

interface AISidebarProps {
  roomId: string
}

export default function AISidebar({ roomId }: AISidebarProps) {
  const { token } = useAuthStore()
  const {
    summary,
    decisions,
    openQuestions,
    actionItems,
    diagramTitle,
    diagramNodes,
    diagramEdges,
    planGoal,
    planPhases,
    loading,
    error,
    summarizeRoom,
    extractActions,
    suggestDiagram,
    generatePlan,
    clear,
  } = useAIStore()

  const [activeTab, setActiveTab] = useState<'summarize' | 'actions' | 'diagram' | 'plan'>(
    'summarize'
  )

  if (!token) return null

  const handleSummarize = async () => {
    clear()
    setActiveTab('summarize')
    await summarizeRoom(roomId, token)
  }

  const handleExtractActions = async () => {
    clear()
    setActiveTab('actions')
    await extractActions(roomId, token)
  }

  const handleSuggestDiagram = async () => {
    clear()
    setActiveTab('diagram')
    await suggestDiagram(roomId, token)
  }

  const handleGeneratePlan = async () => {
    clear()
    setActiveTab('plan')
    await generatePlan(roomId, token)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/15 bg-slate-900/55 font-['Inter'] shadow-lg shadow-black/10 backdrop-blur-md">
      {/* Header */}
      <div className="rounded-t-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
        <h2 className="text-lg font-bold text-white">AI Assistant</h2>
      </div>

      {/* Buttons */}
      <div className="space-y-3 border-b border-white/10 px-4 py-5">
        <button
          onClick={handleSummarize}
          disabled={loading}
          className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-medium text-white shadow-sm shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.01] hover:bg-indigo-600 hover:shadow-md disabled:opacity-50"
        >
          Summarize Chat
        </button>
        <button
          onClick={handleExtractActions}
          disabled={loading}
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.01] hover:bg-white/20 disabled:opacity-50"
        >
          Extract Actions
        </button>
        <button
          onClick={handleSuggestDiagram}
          disabled={loading}
          className="w-full rounded-xl bg-violet-500 px-4 py-3 text-sm font-medium text-white shadow-sm shadow-violet-500/20 transition-all duration-200 hover:scale-[1.01] hover:bg-violet-600 hover:shadow-md disabled:opacity-50"
        >
          Suggest Diagram
        </button>
        <button
          onClick={handleGeneratePlan}
          disabled={loading}
          className="w-full rounded-xl bg-pink-500 px-4 py-3 text-sm font-medium text-white shadow-sm shadow-pink-500/20 transition-all duration-200 hover:scale-[1.01] hover:bg-pink-600 hover:shadow-md disabled:opacity-50"
        >
          Generate Plan
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {loading && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-400"></div>
              <p className="text-sm text-gray-300">Thinking...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-400/40 bg-red-500/20 px-3 py-2 text-sm text-red-100">
            {error}
          </div>
        )}

        {!loading && !error && activeTab === 'summarize' && summary && (
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 font-semibold text-white">Summary</h3>
              <ul className="list-inside list-disc space-y-1">
                {summary.map((item, i) => (
                  <li key={i} className="text-sm text-gray-300">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-white">Decisions</h3>
              <ul className="list-inside list-disc space-y-1">
                {decisions?.map((item, i) => (
                  <li key={i} className="text-sm text-gray-300">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-white">Open Questions</h3>
              <ul className="list-inside list-disc space-y-1">
                {openQuestions?.map((item, i) => (
                  <li key={i} className="text-sm text-gray-300">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {!loading && !error && activeTab === 'actions' && actionItems && (
          <div>
            <h3 className="mb-3 font-semibold text-white">Action Items</h3>
            <div className="space-y-3">
              {actionItems.map((item, i) => (
                <div
                  key={i}
                  className={`rounded-lg border-l-4 p-3 ${
                    item.priority === 'high'
                      ? 'border-red-500 bg-red-500/20'
                      : item.priority === 'medium'
                      ? 'border-yellow-400 bg-yellow-500/20'
                      : 'border-green-500 bg-green-500/20'
                  }`}
                >
                  <p className="text-sm font-medium text-white">{item.task}</p>
                  {item.owner && <p className="text-xs text-gray-300">Owner: {item.owner}</p>}
                  {item.dueDate && (
                    <p className="text-xs text-gray-300">
                      Due: {new Date(item.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && activeTab === 'diagram' && diagramTitle && (
          <div>
            <h3 className="mb-3 font-semibold text-white">{diagramTitle}</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div>
                <p className="mb-1 font-medium text-gray-200">Nodes:</p>
                <ul className="ml-4 list-disc space-y-1">
                  {diagramNodes?.map((node: any, i: number) => (
                    <li key={i} className="text-xs text-gray-300">
                      {node.label} [{node.type}]
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 font-medium text-gray-200">Connections:</p>
                <ul className="ml-4 list-disc space-y-1">
                  {diagramEdges?.map((edge: any, i: number) => (
                    <li key={i} className="text-xs text-gray-300">
                      {edge.from} &rarr; {edge.to}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && activeTab === 'plan' && planGoal && (
          <div>
            <h3 className="mb-2 font-semibold text-white">Goal</h3>
            <p className="mb-4 text-sm text-gray-300">{planGoal}</p>

            <h3 className="mb-2 font-semibold text-white">Phases</h3>
            <div className="space-y-3">
              {planPhases?.map((phase: any, i: number) => (
                <div key={i}>
                  <p className="text-sm font-medium text-gray-200">{phase.name}</p>
                  <ul className="ml-2 list-inside list-disc">
                    {phase.steps?.map((step: any, j: number) => (
                      <li key={j} className="text-xs text-gray-300">
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && !summary && !actionItems && !diagramTitle && !planGoal && (
          <p className="py-8 text-center text-sm text-gray-300">
            Click a button above to get AI insights about your room
          </p>
        )}
      </div>
    </div>
  )
}
