import install from "./install"
import pkg from '../../package.json'
import updateNotifier from 'update-notifier'
import { initConfig, useConfig } from "../core/config"
import { initRepo } from "../core/repo"
import { initApi } from "../core/api"
import inquirer from "inquirer"

inquirer.registerPrompt('search-list', require('inquirer-search-list'))
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'))

export default async function init () {
  updateNotifier({ pkg }).notify()

  await initConfig()
  await initRepo()

  const config      = useConfig()
  const isInstalled = config.has('gitlab.token') && config.has('gitlab.host')

  if (isInstalled)
    await initApi()
  else
    await install()
}
