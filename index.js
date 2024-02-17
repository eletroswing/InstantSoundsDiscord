const {
    Client,
    Events,
    GatewayIntentBits,
    Collection,
} = require("discord.js");

const dotenv = require("dotenv");
dotenv.config();

const path = require("path");
const fs = require("fs");

const TOKEN = process.env.TOKEN;

const deploy = require("./deploy-commands");
const client = new Client({
    intents: [GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(
            `The command in path is broken(missing "data" pr "execute"): ${filePath};`
        );
    }
}

client.once(Events.ClientReady, async (c) => {
    await deploy();
    console.log(`Bot logged in as: ${c.user.tag}`);
});
client.login(TOKEN);

client.on(Events.InteractionCreate, (interaction) => {
    if (interaction.isStringSelectMenu()) {
        execute(interaction, { id: interaction.customId, value: interaction.values[0] })
    }else {
        execute(interaction, undefined)
    }
});

async function execute(interaction, selected = undefined) {

    let command;
    if(selected){
        command = interaction.client.commands.get(interaction.message.interaction.commandName);
    }else {
        if (!interaction.isChatInputCommand()) return;
        command = interaction.client.commands.get(interaction.commandName);
    }

    if (!command) {
        console.error("Command not found.");
        return;
    }
    try {
        await command.execute(
            interaction,
            selected
        );
    } catch (error) {
        console.log(error)
        await interaction.reply("Failed to execute this command");
    }
}