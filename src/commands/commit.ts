import { commitFile, useRepo } from "../core/repo"
import { renderStatus } from "../core/utils"
import path from "path";
import Choice from "inquirer/lib/objects/choice"
import inquirer from 'inquirer'
import { bold } from "kleur"

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
      checked : true,
      disabled: false,
    }
  })
}

export default async function commit () {
  const result = await inquirer.prompt([
    {
      name    : 'files',
      type    : 'checkbox',
      message : 'What file(s) do you want to commit?',
      choices : await searchFiles(),
      validate: (value) => {
        if (!Array.isArray(value) || value.length < 1)
          return 'Please select at least 1 file'

        return true
      }
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
      ]
    },
    {
      name    : 'message',
      type    : 'input',
      message : 'Commit message?',
      validate: (value) => !value ? 'Cannot be blank' : true,
    },
  ])

  const message = `${result.type}: ${result.message}`
  const files   = result.files

  await commitFile(files, message)
}
