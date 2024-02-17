const { REST, Routes } = require("discord.js")

// dotenv
const dotenv = require('dotenv')
dotenv.config()
const { TOKEN, CLIENT_ID } = process.env

// import commands
const fs = require("node:fs")
const path = require("node:path")
const commandsPath = path.join(__dirname, "commands")
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"))

const commands = []

for (const file of commandFiles) { 
   const command = require(`./commands/${file}`)
   commands.push(command.data.toJSON())
}

// REST
const rest = new REST({version: "10"}).setToken(TOKEN);

// deploy
async function deploy() {
    try {
        console.log(`Reset ${commands.length} commands...`)
    
        // PUT
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            {body: commands}
        )
            console.log("Commands registred!")
    }
    catch (error){
        console.error(error)
    }
}

module.exports = deploy;