import { startCase, truncate } from "lodash"
import inquirer from "inquirer"
import { blue, bold } from 'kleur'
import { moveCard, useApi } from "../core/api"
import { useContext } from "../core/context"
import { pushLatest, useRepo } from "../core/repo"
import { formatTitle } from "../core/utils"
import Listr from 'listr'
import console from 'consola'
import Choice from "inquirer/lib/objects/choice"
import Debounce from 'p-debounce'

interface Issue {
  iid: number
  title: string
  type: string
  branch: string
}

async function searchIssue (keyword?: string): Promise<Choice[]> {
  const context = useContext()
  const params: Record<string, any> = {
    projectId        : context.projectId,
    assignee_username: context.username,
    state            : 'opened',
  }

  if (keyword)
    params.search = keyword

  const repo  = useRepo()
  const refs  = await repo.getReferences()
  const regex = /refs\/heads\/((feature|hotfix)\/(\d+)-([\w-]+))/

  const indexes: Map<number, Issue> = new Map()

  for (const ref of refs) {
    const match = regex.exec(ref.name())

    if (match) {
      const branch = match[1]
      const type   = match[2]
      const iid    = Number.parseInt(match[3])
      const title  = startCase(match[4])

      indexes.set(iid, { branch, iid, type, title })
    }
  }

  if (indexes.size > 0)
    params.iids = Array.from(indexes.keys())

  const api    = useApi()
  const issues = await api.Issues.all(params)

  if (!Array.isArray(issues))
    return []

  return issues.map((issue) => {
    const item           = indexes.get(issue.iid as number)
    const title          = issue.title as string ?? item?.title
    const milestone      = (issue.milestone as Record<string, any>)?.title
    const value          = { ...item, issue }
    const name           = milestone ? `(${milestone}) ${title}`: title
    const choice: Choice = {
      name    : `#${issue.iid} ${name}`,
      short   : issue.iid as string,
      value   : value,
      disabled: false,
    }

    return choice
  })
}

async function searchMaintainer (keyword?: string): Promise<Choice[]> {
  const api     = useApi()
  const context = useContext()
  const params  = keyword ? { query: keyword } : {}
  const members = await api.ProjectMembers.all(context.projectId, params)

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

export async function mergeRequest (issue: Issue, assigneeId: number) {
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

  const mrs = await api.Issues.relatedMergeRequests(context.projectId, issue.iid)

  if (!Array.isArray(mrs))
    return true

  return mrs.some((mr) => mr.state === 'opened')
}

export default async function finishTask () {
  const result  = await inquirer.prompt([
    {
      name   : 'issue',
      type   : 'autocomplete',
      message: 'What issue do you want to finish?',
      source : Debounce((answers: any, keyword: string) => searchIssue(keyword), 300),
    },
    {
      name   : 'maintainer',
      type   : 'autocomplete',
      message: 'Assign MR to?',
      source : Debounce((answers: any, keyword: string) => searchMaintainer(keyword), 300),
    },
    {
      name   : 'confirm',
      type   : 'confirm',
      default: false,
      message: (answers) => {
        const title = blue(truncate(answers.issue.title, { length: 45 }))

        return `Are you sure finish task "${title}"`
      }
    }
  ])

  if (!result.confirm)
    return process.exit(0)

  const hasMR   = await hasOpenedMR(result.issue)
  const canMove = result.issue.issue.labels.includes('Doing')
  const tasks   = new Listr([
    {
      title: 'Push to remote repository',
      task : () => pushLatest(result.issue.branch),
    },
    {
      title: 'Create merge request',
      task : () => mergeRequest(result.issue, result.maintainer.id),
      skip : () => {
        if (hasMR)
          return 'Merge Request already created'
      }
    },
    {
      title: 'Move card to "Undeployed"',
      task : () => moveCard(result.issue.issue, 'Doing', 'Undeployed'),
      skip : () => {
        if (!canMove)
          return 'Card can\'t be move to "Undeployed" board'
      }
    }
  ])

  await tasks.run()

  console.success(bold('Done'))
}
