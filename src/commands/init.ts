import install from './install'
import package_ from '../../package.json'
import updateNotifier from 'update-notifier'
import { initConfig, useConfig } from '../core/config'
import { initRepo } from '../core/repo'
import { initApi } from '../core/api'
import inquirer from 'inquirer'

// eslint-disable-next-line @typescript-eslint/no-var-requires
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'))

export default async function init (): Promise<void> {
  updateNotifier({ pkg: package_ }).notify()

  await initConfig()
  await initRepo()

  const config      = useConfig()
  const isInstalled = config.has('gitlab.token') && config.has('gitlab.host')

  await (isInstalled ? initApi() : install())
}
