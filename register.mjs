import { REST, Routes } from "discord.js";
import { readdirSync, existsSync } from "fs";

const commands = [];
const commandFiles = readdirSync("./interactions/commands/")
  .filter((file) => file.endsWith(".mjs"));
for (const file of commandFiles) {
  const command = await import(`./interactions/commands/${file}`);
  if (existsSync(`./interactions/commands/subcommands/${command.data.name}`)) {
    const subcommandFiles = readdirSync(`./interactions/commands/subcommands/${command.data.name}`).filter((file) => file.endsWith(".mjs"));
    for (const file of subcommandFiles) await import(`./interactions/commands/subcommands/${command.data.name}/${file}`);
  }
  commands.push(command.data.toJSON());
}
const contextFiles = readdirSync("./interactions/contexts/")
  .filter((file) => file.endsWith(".mjs"));
for (const file of contextFiles) {
  const contexts = await import(`./interactions/contexts/${file}`);
  commands.push(contexts.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env["TOKEN"]);

(async () => {
  try {
    console.log("スラッシュコマンド登録");
    await rest.put(
      Routes.applicationCommands(process.env["ID"]),
      { body: [] }
    );
    await rest.put(
      Routes.applicationCommands(process.env["ID"]),
      { body: commands }
    );
  } catch (err) {
    console.error(err);
  }
})();