import { revertFile, useRepo } from '../core/repo'
import { promises as fs } from 'fs'

export async function discardFile (files: string[]): Promise<void> {
  const repo   = useRepo()
  const status = await repo.status(files)

  const revert: string[]  = []
  const deleted: string[] = []

  for (const file of status.files) {
    if (file.working_dir === '?')
      deleted.push(file.path)
    else
      revert.push(file.path)
  }

  if (revert.length > 0)
    await revertFile(revert)

  if (deleted.length > 0) {
    for (const file of deleted)
      await fs.rm(file)
  }
}
