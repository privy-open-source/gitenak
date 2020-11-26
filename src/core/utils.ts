import { blue, cyan, green, grey, yellow } from "kleur"
import { StatusFile } from "nodegit"

export function formatTitle(title: string): string {
  return title.replace(/\[.*\]\s*\:?\s/, '').trim()
}

export function validURL(string: string): boolean {
  const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i') // fragment locator

  return !!pattern.test(string)
}

export function renderStatus (status: StatusFile): string {
  const words = []

  if (status.isNew())
    words.push(green("[NEW]"))

  if (status.isModified())
    words.push(yellow("[MODIFIED]"))

  if (status.isTypechange())
    words.push(cyan("[TYPECHANGE]"))

  if (status.isRenamed())
    words.push(blue("[RENAMED]"))

  if (status.isIgnored())
    words.push(grey("[IGNORED]"))

  return words.join('')
}
