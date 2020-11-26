import { startCase, truncate } from 'lodash'
import inquirer from 'inquirer'
import { moveCard, useApi } from '../core/api'
import { useContext } from '../core/context'
import { pushLatest, useRepo } from '../core/repo'
import { formatTitle } from '../core/utils'
import Listr from 'listr'
import console from 'consola'
import Choice from 'inquirer/lib/objects/choice'
import Debounce from 'p-debounce'
import commit from './commit'
import { CancelError } from '../core/error'
import {
  blue,
  bold,
  green,
} from 'kleur'

interface Issue {
  iid: number
  title: string
  type: string
  branch: string
  active: boolean
}

async function searchIssue (keyword?: string): Promise<Choice[]> {
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
  const regex      = /refs\/heads\/((feature|hotfix)\/(\d+)-([\w-]+))/

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
    const flag           = item?.active ? green('[CURRENT]') : ''
    const choice: Choice = {
      name    : `#${issue.iid} ${name} ${flag}`.trim(),
      short   : issue.iid as string,
      value   : value,
      disabled: false,
    }

    return choice
  })
}

async function searchMaintainer (keyword?: string): Promise<Choice[]> {
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

async function mergeRequest (issue: Issue, assigneeId: number): Promise<void> {
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

async function hasChanges (): Promise<boolean> {
  try {
    const repo  = useRepo()
    const files = await repo.getStatus()

    return files.length > 0
  } catch {
    return false
  }
}

async function hasOpenedMR (issue: Issue): Promise<boolean> {
  const api     = useApi()
  const context = useContext()
  const mrs     = await api.Issues.relatedMergeRequests(context.projectId, issue.iid)

  if (!Array.isArray(mrs))
    return true

  return mrs.some((mr) => mr.state === 'opened')
}

export default async function finishTask (): Promise<void> {
  if (await hasChanges()) {
    const answer = await inquirer.prompt([
      {
        name   : 'commit',
        type   : 'confirm',
        message: 'You have uncommited files, do you want commit it first?',
        default: true,
      },
    ])

    if (answer.commit)
      await commit()
  }

  const answer = await inquirer.prompt([
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
      },
    },
  ])

  if (!answer.confirm)
    throw new CancelError()

  const hasMR   = await hasOpenedMR(answer.issue)
  const canMove = answer.issue.issue.labels.includes('Doing')
  const tasks   = new Listr([
    {
      title: 'Push to remote repository',
      task : () => pushLatest(answer.issue.branch),
    },
    {
      title: 'Create merge request',
      task : () => mergeRequest(answer.issue, answer.maintainer.id),
      skip : () => {
        if (hasMR)
          return 'Merge Request already created'
      },
    },
    {
      title: 'Move card to "Undeployed"',
      task : () => moveCard(answer.issue.issue, 'Doing', 'Undeployed'),
      skip : () => {
        if (!canMove)
          return 'Card can\'t be move to "Undeployed" board'
      },
    },
  ])

  try {
    await tasks.run()

    console.success(bold('Done'))
  } catch (error) {
    console.error(error.message)
  }
}
