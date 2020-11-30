import boxen from 'boxen'
import figures from 'figures'
import { underline, blue } from 'kleur'

export function installMessage (host: string): string {
  const message = `
  ${underline('How to create Personal Token:')}
  1. goto ${blue(`${host}/profile/personal_access_tokens`)}
  2. create token with following setting:
    - Name: (whatever)
    - Expires at: (blank)
    - Scope:
      ☒ api
      ☒ read_user
  `.trim()

  return boxen(figures(message), { padding: 1 })
}
