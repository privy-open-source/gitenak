export interface Context {
  email: string
  projectId: string
  username: string
  remote: Remote
}

export interface Remote {
  url: string
  name: string
}

export let context: Context = {
  email    : '',
  projectId: '',
  username : '',
  remote   : {
    url : '',
    name: 'origin',
  }
}

export function useContext (): Context {
  return context
}
