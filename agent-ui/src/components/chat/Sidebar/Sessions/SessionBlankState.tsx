'use client'

import { useStore } from '@/store'
import { useQueryState } from 'nuqs'

const SessionBlankState = () => {
  const { selectedEndpoint, isEndpointActive } = useStore()
  const [agentId] = useQueryState('agent')

  const message = (() => {
    switch (true) {
      case !isEndpointActive:
        return 'Подключитесь к endpoint для просмотра истории'
      case !selectedEndpoint:
        return 'Выберите endpoint для просмотра истории'
      case !agentId:
        return 'Выберите агента для просмотра истории'
      default:
        return 'Начните диалог — сессия появится здесь'
    }
  })()

  return (
    <div className="px-2 py-6 text-center">
      <p className="text-xs text-muted">{message}</p>
    </div>
  )
}

export default SessionBlankState
