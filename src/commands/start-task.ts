import { kebabCase, truncate } from 'lodash'
import console from 'consola'
import inquirer from 'inquirer'
import { moveCard } from '../core/api'
import { startBranch } from '../core/repo'
import { formatTitle, renderWorflow } from '../core/utils'
import Listr from 'listr'
import Debounce from 'p-debounce'
import { CancelError } from '../core/error'
import { allowMove, searchIssue } from '../modules/start-task'
import { Issue } from '../../types/gitlab'
import {
  blue,
  bold,
} from 'kleur'

interface Answers {
  issue: Issue,
  flow: 'feature' | 'bugfix' | 'hotfix'
  confirm: boolean
}

export default async function startTask (): Promise<void> {
  const result = await inquirer.prompt<Answers>([
    {
      name   : 'issue',
      type   : 'autocomplete',
      message: 'What issue do you want to start?',
      source : Debounce((answers, keyword: string) => searchIssue(keyword), 300),
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
      message: (answers) => {
        const title = blue(truncate(answers.issue.title, { length: 45 }))
        const flow  = renderWorflow(answers.flow)

        return `Are you sure start task ${flow}: ${title}?`
      },
    },
  ])

  if (!result.confirm)
    throw new CancelError()

  const iid        = result.issue.iid
  const title      = formatTitle(result.issue.title)
  const branchName = kebabCase(`${iid}-${title}`)
  const canMove    = allowMove(result.issue.labels)

  const tasks = new Listr([
    {
      title: 'Create new branch',
      task : () => {
        const source = result.flow === 'hotfix'
          ? 'master'
          : 'develop'

        return startBranch(result.flow, branchName, source)
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
