import { StatusFile } from 'nodegit'
import {
  blue,
  cyan,
  green,
  grey,
  magenta,
  red,
  yellow,
} from 'kleur'

export function formatTitle (title: string): string {
  return title.replace(/\[.*]\s*:?\s/, '').trim()
}

export function validURL (string: string): boolean {
  const pattern = new RegExp('^(https?:\\/\\/)?' // protocol
    + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' // domain name
    + '((\\d{1,3}\\.){3}\\d{1,3}))' // OR ip (v4) address
    + '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' // port and path
    + '(\\?[;&a-z\\d%_.~+=-]*)?' // query string
    + '(\\#[-a-z\\d_]*)?$', 'i') // fragment locator

  return !!pattern.test(string)
}

export function renderLabel (labels: string[]): string {
  return labels.map((label) => {
    switch (label) {
      case 'High':
      case 'Bug':
        return red(`[${label}]`)

      case 'To Do':
        return yellow(`[${label}]`)

      case 'Doing':
      case 'Feature':
        return green(`[${label}]`)

      case 'QA':
      case 'In Review':
      case 'Revise':
        return blue(`[${label}]`)

      case 'Undeployed':
        return magenta(`[${label}]`)

      case 'Low':
        return grey(`[${label}]`)

      default:
        return `[${label}]`
    }
  }).join('')
}

export function renderStatus (status: StatusFile): string {
  const words = []

  if (status.isNew())
    words.push(green('[NEW]'))

  if (status.isModified())
    words.push(yellow('[MODIFIED]'))

  if (status.isTypechange())
    words.push(cyan('[TYPECHANGE]'))

  if (status.isDeleted())
    words.push(red('[DELETED]'))

  if (status.isRenamed())
    words.push(blue('[RENAMED]'))

  if (status.isIgnored())
    words.push(grey('[IGNORED]'))

  return words.join('')
}

export function renderWorflow (workflow: string): string {
  if (workflow === 'hotfix')
    return red(workflow)

  if (workflow === 'feature')
    return green(workflow)

  if (workflow === 'bugfix')
    return yellow(workflow)

  return workflow
}
