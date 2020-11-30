import Choice from 'inquirer/lib/objects/choice'
import { bold } from 'kleur'
import { useRepo } from '../core/repo'
import { renderStatus } from '../core/utils'
import path from 'path'

export async function searchFiles (): Promise<Choice[]> {
  const repo   = useRepo()
  const status = await repo.status()
  const files  = status.files

  return files.map((file) => {
    const filename = path.basename(file.path)
    const name     = file.path.replace(filename, bold(filename))
    const status   = renderStatus(file)

    return {
      name    : `${name} ${status}`,
      value   : file.path,
      short   : filename,
      checked : false,
      disabled: false,
    }
  })
}
