import { kebabCase, truncate } from 'lodash'
import { blue, red, green, bold } from 'kleur'
import console from 'consola'
import inquirer from 'inquirer'
import { moveCard, useApi } from "../core/api"
import { startFeature, startHotfix } from '../core/repo'
import { useContext } from '../core/context'
import { formatTitle } from '../core/utils'
import Listr from 'listr'
import Choice from 'inquirer/lib/objects/choice'
import Debounce from 'p-debounce'

const DISALLOW_CARD_MOVE = [
  'Doing',
  'Undeployed',
  'QA',
  'In Review',
  'Revise'
]

async function searchIssue (keyword?: string): Promise<Choice[]> {
  const context = useContext()
  const params: Record<string, any> = {
    projectId: context.projectId,
    state    : 'opened',
  }

  if (keyword && /^#\d+/.test(keyword)) {
    params.iids = [parseInt(keyword.slice(1))]
  } else {
    if (keyword)
      params.search = keyword

    params.assignee_username = context.username
    params.labels            = ['To Do']
  }

  const api    = useApi()
  const issues = await api.Issues.all(params)

  if (!Array.isArray(issues))
    return []

  return issues.map((issue) => {
    const title: string     = issue.title as string
    const milestone: string = (issue.milestone as Record<string, any>)?.title
    const name              = milestone ? `(${milestone}) ${title}`: title
    const choice: Choice    = {
      name    : `#${issue.iid} ${name}`,
      short   : issue.iid as string,
      value   : issue,
      disabled: false,
    }

    return choice
  })
}

export default async function startTask () {
  const result  = await inquirer.prompt([
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
        { name: 'Feature', value: 'feature' },
        { name: 'Hotfix', value: 'hotfix' },
      ]
    },
    {
      name   : 'confirm',
      type   : 'confirm',
      default: false,
      message: (answers: any) => {
        let title = answers.issue.title
        let flow  = answers.flow

        title = blue(truncate(title, { length: 45 }))
        flow  = flow === 'hotfix' ? red(flow) : green(flow)

        return `Are you sure start task ${flow}: "${title}"`
      }
    }
  ])

  if (!result.confirm)
    return process.exit(0)

  const iid        = result.issue.iid
  const title      = formatTitle(result.issue.title)
  const branchName = kebabCase(`${iid}-${title}`)
  const canMove    = result.issue.labels.every((label: string) => {
    return !DISALLOW_CARD_MOVE.includes(label)
  })

  const tasks = new Listr([
    {
      title: 'Create new branch',
      task : () => {
        if (result.flow === 'hotfix')
          return startHotfix(branchName)
        else
          return startFeature(branchName)
      },
    },
    {
      title: 'Move card to "Doing" board',
      task : () => moveCard(result.issue, 'To Do', 'Doing'),
      skip : () => {
        if (!canMove)
          return 'Card can\'t be move to "Doing" board'
      },
    }
  ])

  await tasks.run()

  console.success(bold('Done'))
}

