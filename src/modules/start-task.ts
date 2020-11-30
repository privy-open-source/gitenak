import Choice from 'inquirer/lib/objects/choice'
import { useApi } from '../core/api'
import { useContext } from '../core/context'
import { renderLabel } from '../core/utils'

export async function searchIssue (keyword?: string): Promise<Choice[]> {
  const context                         = useContext()
  const parameters: Record<string, any> = {
    projectId: context.projectId,
    state    : 'opened',
  }

  if (keyword && /^#\d+/.test(keyword))
    parameters.iids = [Number.parseInt(keyword.slice(1))]
  else {
    if (keyword)
      parameters.search = keyword

    parameters.assignee_username = context.username
    parameters.labels            = ['To Do']
  }

  const api    = useApi()
  const issues = await api.Issues.all(parameters)

  if (!Array.isArray(issues))
    return []

  return issues.map((issue) => {
    const title: string     = issue.title as string
    const milestone: string = (issue.milestone as Record<string, any>)?.title
    const name              = milestone ? `(${milestone}) ${title}` : title
    const labels            = renderLabel(issue.labels as string[])
    const choice: Choice    = {
      name    : `#${issue.iid} ${name} ${labels}`.trim(),
      short   : issue.iid as string,
      value   : issue,
      disabled: false,
    }

    return choice
  })
}

const DISALLOW_CARD_MOVE = new Set([
  'Doing',
  'Undeployed',
  'QA',
  'In Review',
  'Revise',
])

export function allowMove (labels: string[]): boolean {
  return labels.every((label) => !DISALLOW_CARD_MOVE.has(label))
}
