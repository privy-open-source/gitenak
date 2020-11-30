import inquirer from 'inquirer'
import console from 'consola'
import { searchFiles } from '../modules/commit'
import { bold, green } from 'kleur'
import { CancelError } from '../core/error'
import Listr from 'listr'
import { discardFile } from '../modules/discard'

export default async function status (): Promise<void> {
  const unstages = await searchFiles()

  if (unstages.length === 0)
    return console.warn('Nothing to discard, working tree clean')

  const result = await inquirer.prompt([
    {
      name    : 'files',
      type    : 'checkbox',
      message : 'What file(s) do you want to discard?',
      choices : unstages,
      loop    : false,
      validate: (value) => {
        if (!Array.isArray(value) || value.length === 0)
          return 'Please select at least 1 file'

        return true
      },
    },
    {
      name   : 'confirm',
      type   : 'confirm',
      default: false,
      message: (answers: any) => {
        const total = green(answers.files.length)

        return `Are you sure discard ${total} file(s)`
      },
    },
  ])

  if (!result.confirm)
    throw new CancelError()

  const tasks = new Listr([
    {
      title: 'Reverting changes',
      task : () => discardFile(result.files),
    },
  ])

  try {
    await tasks.run()

    console.success(bold('Done'))
  } catch (error) {
    console.error(error.message)
  }
}
