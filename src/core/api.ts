import { Gitlab } from '@gitbeaker/node'
import { Issue } from '../../types/gitlab'
import { useConfig } from './config'
import { useContext } from './context'

export type GitlabApi = InstanceType<typeof Gitlab>

export let api: GitlabApi

export async function initApi (): Promise<void> {
  const config = useConfig()

  api = new Gitlab({
    host : config.get('gitlab.host'),
    token: config.get('gitlab.token'),
  })

  const response = await api.Users.current()
  const context  = useContext()

  if (!Array.isArray(response)) {
    context.username = response.username as string
    context.email    = response.email as string
  }
}

export function useApi (): GitlabApi {
  return api
}

export async function testApi (host: string, token: string): Promise<boolean> {
  try {
    const api      = new Gitlab({ host, token })
    const response = await api.Users.current()

    return !Array.isArray(response)
      && response.username !== undefined
      && response.username !== null
  } catch {
    return false
  }
}

export async function moveCard (issue: Issue, from: string, to: string): Promise<Issue> {
  const context = useContext()
  const api     = useApi()
  const labels  = issue.labels
    .filter((item: string) => item !== from)
    .concat(to)

  return api.Issues.edit(context.projectId, issue.iid, { labels: labels }) as Promise<unknown> as Promise<Issue>
}

export async function showIssue (issueId: number): Promise<Issue> {
  const context = useContext()
  const api     = useApi()

  return api.Issues.show(context.projectId, issueId) as Promise<unknown> as Promise<Issue>
}
