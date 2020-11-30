import { bold } from 'kleur'
import Listr from 'listr'
import console from 'consola'
import { pushLatest, useRepo } from '../core/repo'

export default async function push (): Promise<void> {
  const repo   = useRepo()
  const branch = (await repo.branch()).current
  const tasks  = new Listr([
    {
      title: `Pushing branch ${branch}`,
      task : () => pushLatest(branch),
    },
  ])

  try {
    await tasks.run()

    console.success(bold('Done'))
  } catch (error) {
    console.error(error.message)
  }
}
