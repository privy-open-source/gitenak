import { renderStatus } from '../core/utils'
import path from 'path'
import Choice from 'inquirer/lib/objects/choice'
import inquirer from 'inquirer'
import {
  blue,
  bold,
  green,
} from 'kleur'
import console from 'consola'
import Listr from 'listr'
import LintStaged from 'lint-staged'
import {
  commitFile,
  stageFile,
  useRepo,
} from '../core/repo'
import { truncate } from 'lodash'
import { CancelError } from '../core/error'

export async function searchFiles (): Promise<Choice[]> {
  const repo  = useRepo()
  const files = await repo.getStatus()

  return files.map((file) => {
    const filename = path.basename(file.path())
    const name     = file.path().replace(filename, bold(filename))
    const status   = renderStatus(file)

    return {
      name    : `${name} ${status}`,
      value   : file.path(),
      short   : filename,
      checked : false,
      disabled: false,
    }
  })
}

export default async function commit (): Promise<void> {
  const unstages = await searchFiles()

  if (unstages.length === 0)
    return console.warn('Nothing to commit, working tree clean')

  const result = await inquirer.prompt([
    {
      name    : 'files',
      type    : 'checkbox',
      message : 'What file(s) do you want to commit?',
      choices : unstages,
      loop    : false,
      validate: (value) => {
        if (!Array.isArray(value) || value.length === 0)
          return 'Please select at least 1 file'

        return true
      },
    },
    {
      name   : 'type',
      type   : 'list',
      message: 'Changes type?',
      default: 'changed',
      choices: [
        { name: 'Changed', value: 'changed' },
        { name: 'Added', value: 'added' },
        { name: 'Fixed', value: 'fixed' },
        { name: 'Deleted', value: 'deleted' },
      ],
    },
    {
      name    : 'message',
      type    : 'input',
      message : 'Commit message?',
      validate: (value) => !value ? 'Cannot be blank' : true,
    },
    {
      name   : 'confirm',
      type   : 'confirm',
      default: false,
      message: (answers: any) => {
        const message = truncate(answers.message, { length: 70 })
        const type    = bold(answers.type)
        const title   = blue(`${type}: ${message}`)
        const total   = green(answers.files.length)

        return `Are you sure commit ${total} file(s) with message: "${title}"`
      },
    },
  ])

  if (!result.confirm)
    throw new CancelError()

  const message = `${result.type}: ${result.message}`
  const files   = result.files
  const tasks   = new Listr([
    {
      title: 'Staging seleted files',
      task : () => stageFile(files),
    },
    {
      title: 'Run lint staged',
      task : (context, task) => {
        return new Promise((resolve, reject) => {
          LintStaged({ quiet: true })
            .then((success: boolean) => {
              if (success)
                resolve()
              else
                reject(new Error('Linting failed'))
            })
            .catch(() => {
              task.skip('This project has no lint staged config')
            })
        })
      },
    },
    {
      title: 'Create commit',
      task : () => commitFile(message),
    },
  ])

  try {
    await tasks.run()

    console.success(bold('Done'))
  } catch (error) {
    console.error(error.message)
  }
}
