import inquirer from 'inquirer'
import console from 'consola'
import { testApi } from '../core/api'
import { config } from '../core/config'
import { validURL } from '../core/utils'
import { bold } from 'kleur'
import { installMessage } from '../modules/install'

export default async function install (): Promise<void> {
  const result = await inquirer.prompt([
    {
      name    : 'host',
      type    : 'input',
      message : 'Gitlab host URL:',
      default : 'https://gitlab.privy.id',
      validate: (value) => !validURL(value) ? 'Must valid URL' : true,
    },
    {
      name    : 'token',
      type    : 'input',
      message : ({ host }) => `\r\n${installMessage(host)}\r\nInput your token here:`,
      validate: async (token, { host }) => {
        const check = await testApi(host, token)

        if (!check)
          return 'Invalid personal token'

        return true
      },
    },
  ])

  config.set('gitlab.host', result.host)
  config.set('gitlab.token', result.token)

  console.success(bold('Install success'))
}
