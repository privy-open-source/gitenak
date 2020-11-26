import inquirer from 'inquirer'
import boxen from 'boxen'
import figures from 'figures'
import { testApi } from '../core/api'
import { config } from '../core/config'
import { validURL } from '../core/utils'

function installMessage (host: string): string {
  const message = `
  How to create Personal Token:
  1. goto ${host}/profile/personal_access_tokens
  2. create token with following setting:
    - Name: (whatever)
    - Expires at: (blank)
    - Scope:
      ☒ api
      ☒ read_user
  `.trim()

  return boxen(figures(message), { padding: 1 })
}

export default async function install () {
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
      }
    },
  ])

  config.set('gitlab.host', result.host)
  config.set('gitlab.token', result.token)

  process.stdout.write('\x1Bc')
}
