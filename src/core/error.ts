export class CancelError extends Error {
  constructor (message = 'Canceled') {
    super(message)

    this.name = 'UserCanceled'
  }
}
