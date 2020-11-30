import { truncate } from 'lodash'
import inquirer from 'inquirer'
import { moveCard } from '../core/api'
import { hasChanges, pushLatest } from '../core/repo'
import Listr from 'listr'
import console from 'consola'
import Debounce from 'p-debounce'
import commit from './commit'
import { CancelError } from '../core/error'
import {
  blue,
  bold,
} from 'kleur'
import {
  searchIssue,
  searchMaintainer,
  hasOpenedMR,
  mergeRequest,
} from '../modules/finish-task'

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

        return `Are you sure finish task ${title}?`
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
