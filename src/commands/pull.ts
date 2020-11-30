import console from 'consola'
import { bold } from 'kleur'
import { pullLatest, useRepo } from '../core/repo'
import Listr from 'listr'

export default async function pull (): Promise<void> {
  const repo   = useRepo()
  const branch = (await repo.branch()).current
  const tasks  = new Listr([
    {
      title: `Pulling branch ${branch}`,
      task : () => pullLatest(branch),
    },
  ])

  try {
    await tasks.run()

    console.success(bold('Done'))
  } catch (error) {
    console.error(error.message)
  }
}
