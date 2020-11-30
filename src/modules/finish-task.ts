import { startCase } from 'lodash'
import { useApi } from '../core/api'
import { useContext } from '../core/context'
import { useRepo } from '../core/repo'
import { formatTitle, renderLabel } from '../core/utils'
import Choice from 'inquirer/lib/objects/choice'
import { green } from 'kleur'

interface Issue {
  iid: number
  title: string
  type: string
  branch: string
  active: boolean
}

export async function searchIssue (keyword?: string): Promise<Choice[]> {
  const context                         = useContext()
  const parameters: Record<string, any> = {
    projectId        : context.projectId,
    assignee_username: context.username,
    state            : 'opened',
  }

  if (keyword)
    parameters.search = keyword

  const repo       = useRepo()
  const references = await repo.getReferences()
  const current    = await repo.getCurrentBranch()
  const regex      = /refs\/heads\/((feature|bugfix|hotfix)\/(\d+)-([\w-]+))/

  const indexes: Map<number, Issue> = new Map()

  for (const reference of references) {
    const match = regex.exec(reference.name())

    if (match) {
      const branch = match[1]
      const type   = match[2]
      const iid    = Number.parseInt(match[3])
      const title  = startCase(match[4])
      const active = current.name() === reference.name()

      indexes.set(iid, {
        branch,
        iid,
        type,
        title,
        active,
      })
    }
  }

  if (indexes.size > 0)
    parameters.iids = [...indexes.keys()]

  const api    = useApi()
  const issues = await api.Issues.all(parameters)

  if (!Array.isArray(issues))
    return []

  return issues.map((issue) => {
    const item           = indexes.get(issue.iid as number)
    const title          = issue.title as string ?? item?.title
    const milestone      = (issue.milestone as Record<string, any>)?.title
    const value          = { ...item, issue }
    const name           = milestone ? `(${milestone}) ${title}` : title
    const flag           = item?.active ? green('*CURRENT*') : ''
    const labels         = renderLabel(issue.labels as string[])
    const choice: Choice = {
      name    : `#${issue.iid} ${name} ${labels} ${flag}`.trim(),
      short   : issue.iid as string,
      value   : value,
      disabled: false,
    }

    return choice
  })
}

export async function searchMaintainer (keyword?: string): Promise<Choice[]> {
  const api        = useApi()
  const context    = useContext()
  const parameters = keyword ? { query: keyword } : {}
  const members    = await api.ProjectMembers.all(context.projectId, parameters)

  if (!Array.isArray(members))
    return []

  return members
    .filter((member) => {
      return member.access_level === 40
    })
    .map((member) => {
      const name     = member.name as string
      const username = member.username as string

      return {
        name    : `${name} (@${username})`,
        short   : `@${username}`,
        value   : member,
        disabled: false,
      }
    })
}

export async function mergeRequest (issue: Issue, assigneeId: number): Promise<void> {
  const api     = useApi()
  const context = useContext()
  const title   = formatTitle(issue.title)
  const body    = {
    description         : `#${issue.iid}`,
    assignee_id         : assigneeId,
    remove_source_branch: true,
  }

  await api.MergeRequests.create(context.projectId, issue.branch, 'develop', title, body)
}

export async function hasOpenedMR (issue: Issue): Promise<boolean> {
  const api     = useApi()
  const context = useContext()
  const mrs     = await api.Issues.relatedMergeRequests(context.projectId, issue.iid)

  if (!Array.isArray(mrs))
    return true

  return mrs.some((mr) => mr.state === 'opened')
}
