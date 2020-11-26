import mainMenu from './commands/main-menu'
import init from './commands/init'
import console from 'consola'

(async () => {
  try {
    await init()
    await mainMenu()
  } catch (error) {
    console.error(error)
  }
})()
