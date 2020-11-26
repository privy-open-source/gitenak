import mainMenu from './commands/main-menu'
import init from './commands/init'
import console from 'consola'
import { CancelError } from './core/error'
import { grey } from 'kleur'

(async () => {
  try {
    await init()
    await mainMenu()

    process.exitCode = 0
  } catch (error) {
    if (error instanceof CancelError) {
      process.exitCode = 0

      console.info(grey(error.message))
    } else {
      process.exitCode = 1

      console.error(error)
    }
  }
})()
