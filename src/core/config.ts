import Configstore from 'configstore'
import packageJson from '../../package.json'

export let config: Configstore

export async function initConfig () {
  config = new Configstore(packageJson.name)
}

export function useConfig (): Configstore {
  return config
}
