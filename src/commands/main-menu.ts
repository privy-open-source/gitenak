import inquirer from 'inquirer'

export default async function mainMenu () {
  const result = await inquirer.prompt([
    {
      type   : 'list',
      name   : 'menu',
      message: 'What do you want??',
      choices: [
        { name: 'Start Task', value: 'start-task' },
        { name: 'Finish Task', value: 'finish-task' },
        { name: 'Commit', value: 'commit' },
      ],
    }
  ])

  if (result.menu)
    await require(`./${result.menu}`).default()
}
