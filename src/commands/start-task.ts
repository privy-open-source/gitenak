import { kebabCase, truncate } from 'lodash'
import console from 'consola'
import inquirer from 'inquirer'
import { moveCard, useApi } from '../core/api'
import { startFeature, startHotfix } from '../core/repo'
import { useContext } from '../core/context'
import { formatTitle, renderWorflow } from '../core/utils'
import Listr from 'listr'
import Choice from 'inquirer/lib/objects/choice'
import Debounce from 'p-debounce'
import { blue, bold } from 'kleur'
import { CancelError } from '../core/error'

const DISALLOW_CARD_MOVE = new Set([
  'Doing',
  'Undeployed',
  'QA',
  'In Review',
  'Revise',
])

async function searchIssue (keyword?: string): Promise<Choice[]> {
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
    const choice: Choice    = {
      name    : `#${issue.iid} ${name}`,
      short   : issue.iid as string,
      value   : issue,
      disabled: false,
    }

    return choice
  })
}

export default async function startTask (): Promise<void> {
  const result = await inquirer.prompt([
    {
      name   : 'issue',
      type   : 'autocomplete',
      message: 'What issue do you want to start?',
      source : Debounce((answers: any, keyword: string) => searchIssue(keyword), 300),
    },
    {
      name   : 'flow',
      type   : 'list',
      message: 'Issue type?',
      default: 'feature',
      choices: [
        { name: 'Bugfix', value: 'bugfix' },
        { name: 'Feature', value: 'feature' },
        { name: 'Hotfix', value: 'hotfix' },
      ],
    },
    {
      name   : 'confirm',
      type   : 'confirm',
      default: false,
      message: (answers: any) => {
        let title = answers.issue.title
        let flow  = answers.flow

        title = blue(truncate(title, { length: 45 }))
        flow  = renderWorflow(flow)

        return `Are you sure start task ${flow}: "${title}"`
      },
    },
  ])

  if (!result.confirm)
    throw new CancelError()

  const iid        = result.issue.iid
  const title      = formatTitle(result.issue.title)
  const branchName = kebabCase(`${iid}-${title}`)
  const canMove    = result.issue.labels.every((label: string) => {
    return !DISALLOW_CARD_MOVE.has(label)
  })

  const tasks = new Listr([
    {
      title: 'Create new branch',
      task : () => {
        return result.flow === 'hotfix'
          ? startHotfix(branchName)
          : startFeature(branchName)
      },
    },
    {
      title: 'Move card to "Doing" board',
      task : () => moveCard(result.issue, 'To Do', 'Doing'),
      skip : () => {
        if (!canMove)
          return 'Card can\'t be move to "Doing" board'
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
