import { FileStatusResult } from 'simple-git'
import {
  blue,
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

export function renderStatus (file: FileStatusResult): string {
  // ' ' = unmodified
  // M   = modified
  // A   = added
  // D   = deleted
  // R   = renamed
  // C   = copied
  // U   = updated but unmerged

  switch (file.working_dir) {
    case '?':
    case ' ':
    case 'A':
      return green('[NEW]')

    case 'M':
      return yellow('[MODIFIED]')

    case 'D':
      return red('[DELETED]')

    case 'R':
      return blue('[RENAMED]')

    case 'C':
      return yellow('[COPIED]')

    default:
      return `[${file.working_dir}]`
  }
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
