import { toast } from 'sonner'

import { APIRoutes } from './routes'

import {
  AgentDetails,
  Sessions,
  TeamDetails,
  ComponentItem,
  ComponentConfig
} from '@/types/os'

const headers: HeadersInit = {
  'Content-Type': 'application/json'
}

export const getAgentsAPI = async (
  endpoint: string
): Promise<AgentDetails[]> => {
  const url = APIRoutes.GetAgents(endpoint)
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers
    })
    if (!response.ok) {
      toast.error(`Failed to fetch agents: ${response.statusText}`)
      return []
    }
    const data = await response.json()
    return data
  } catch {
    toast.error('Error fetching agents')
    return []
  }
}

export const getStatusAPI = async (base: string): Promise<number> => {
  const response = await fetch(APIRoutes.Status(base), {
    method: 'GET',
    headers
  })
  return response.status
}

export const getAllSessionsAPI = async (
  base: string,
  type: 'agent' | 'team',
  componentId: string,
  dbId?: string
): Promise<Sessions | { data: [] }> => {
  try {
    const url = new URL(APIRoutes.GetSessions(base))
    url.searchParams.set('type', type)
    url.searchParams.set('component_id', componentId)
    if (dbId) url.searchParams.set('db_id', dbId)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      if (response.status === 404) {
        return { data: [] }
      }
      throw new Error(`Failed to fetch sessions: ${response.statusText}`)
    }
    return response.json()
  } catch {
    return { data: [] }
  }
}

export const getSessionAPI = async (
  base: string,
  type: 'agent' | 'team',
  sessionId: string,
  dbId?: string
) => {
  // build query string
  const queryParams = new URLSearchParams({ type })
  if (dbId) queryParams.append('db_id', dbId)

  const response = await fetch(
    `${APIRoutes.GetSession(base, sessionId)}?${queryParams.toString()}`,
    {
      method: 'GET',
      headers
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch session: ${response.statusText}`)
  }

  return response.json()
}

export const deleteSessionAPI = async (
  base: string,
  dbId: string,
  sessionId: string
) => {
  const queryParams = new URLSearchParams()
  if (dbId) queryParams.append('db_id', dbId)
  const response = await fetch(
    `${APIRoutes.DeleteSession(base, sessionId)}?${queryParams.toString()}`,
    {
      method: 'DELETE',
      headers
    }
  )
  return response
}

export const getTeamsAPI = async (endpoint: string): Promise<TeamDetails[]> => {
  const url = APIRoutes.GetTeams(endpoint)
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers
    })
    if (!response.ok) {
      toast.error(`Failed to fetch teams: ${response.statusText}`)
      return []
    }
    const data = await response.json()

    return data
  } catch {
    toast.error('Error fetching teams')
    return []
  }
}

export const deleteTeamSessionAPI = async (
  base: string,
  teamId: string,
  sessionId: string
) => {
  const response = await fetch(
    APIRoutes.DeleteTeamSession(base, teamId, sessionId),
    {
      method: 'DELETE',
      headers
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to delete team session: ${response.statusText}`)
  }
  return response
}

export const getComponentsAPI = async (
  endpoint: string,
  type: string = 'agent'
): Promise<{ data: ComponentItem[] }> => {
  const url = `${APIRoutes.Components(endpoint)}?component_type=${encodeURIComponent(type)}`
  try {
    const response = await fetch(url, { method: 'GET', headers })
    if (!response.ok) return { data: [] }
    return response.json()
  } catch (error) {
    console.error('[getComponentsAPI] Failed:', error)
    return { data: [] }
  }
}

export const getComponentConfigAPI = async (
  endpoint: string,
  componentId: string
): Promise<ComponentConfig | null> => {
  try {
    const response = await fetch(
      APIRoutes.ComponentConfig(endpoint, componentId),
      { method: 'GET', headers }
    )
    if (!response.ok) return null
    return response.json()
  } catch (error) {
    console.error('[getComponentConfigAPI] Failed:', error)
    return null
  }
}

export const deleteComponentAPI = async (
  endpoint: string,
  componentId: string
): Promise<boolean> => {
  try {
    const response = await fetch(APIRoutes.Component(endpoint, componentId), {
      method: 'DELETE',
      headers
    })
    return response.ok
  } catch (error) {
    console.error('[deleteComponentAPI] Failed:', error)
    return false
  }
}

export const createAgentAPI = async (
  endpoint: string,
  data: {
    name: string
    model: string
    tools: string[]
    system_message: string
    send_media_to_model: boolean
  }
): Promise<unknown> => {
  const url = `${endpoint}/create`
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail ?? response.statusText)
  }
  return response.json()
}

export const updateAgentAPI = async (
  endpoint: string,
  componentId: string,
  data: {
    name: string
    tools: string[]
    system_message: string
    send_media_to_model: boolean
  }
): Promise<{ component_id: string; config: Record<string, unknown> }> => {
  try {
    const response = await fetch(APIRoutes.ManageAgent(endpoint, componentId), {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(body?.detail ?? response.statusText)
    }
    return response.json()
  } catch (error) {
    console.error('[updateAgentAPI] Failed:', error)
    throw error
  }
}
