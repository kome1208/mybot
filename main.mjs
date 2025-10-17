import { Client, GatewayIntentBits, Partials, Collection, ActivityType } from "discord.js";
import * as fs from "fs";
import { Player } from "discord-player";
import { YoutubeiExtractor } from "discord-player-youtubei";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildExpressions,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.AutoModerationExecution
    ],
    partials: [
        Partials.User,
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
        Partials.Reaction,
        Partials.GuildScheduledEvent,
        Partials.ThreadMember
    ],
    presence: {
        activities: [
            {
                name: "Sigma Boy",
                type: ActivityType.Listening
            }
        ]
    },
    allowedMentions: {
        repliedUser: false
    }
});
const player = new Player(client);
await player.extractors.register(YoutubeiExtractor, {
    streamOptions: {
        useClient: "TV"
    },
    overrideDownloadOptions: {
        codec: "opus",
        format: "webm",
        type: "audio",
        quality: "best"
    },
    innertubeConfigRaw: {
        lang: "ja",
        player_id: "0004de42"
    }
});

const eventFiles = fs.readdirSync("./events").filter(file => file.endsWith(".mjs"));
for (const file of eventFiles) {
	const event = await import(`./events/${file}`);
	if (event.once) 
		client.once(event.name, (...args) => event.execute(...args, client));
	else if (event.player) 
        player.events.on(event.name, (...args) => event.execute(...args));
    else 
		client.on(event.name, (...args) => event.execute(...args, client));
	
}

client.slashCommands = new Collection();
const commandFiles = fs.readdirSync("./interactions/commands").filter((file) => file.endsWith(".mjs"));
for (const file of commandFiles) {
    const command = await import(`./interactions/commands/${file}`);
    if (fs.existsSync(`./interactions/commands/subcommands/${command.data.name}`)) {
        const subcommandFiles = fs.readdirSync(`./interactions/commands/subcommands/${command.data.name}`).filter((file) => file.endsWith(".mjs"));
        for (const file of subcommandFiles) await import(`./interactions/commands/subcommands/${command.data.name}/${file}`);
    }
    client.slashCommands.set(command.data.name, command);
}

client.contextMenus = new Collection();
const contextFiles = fs.readdirSync("./interactions/contexts").filter((file) => file.endsWith(".mjs"));
for (const file of contextFiles) {
    const context = await import(`./interactions/contexts/${file}`);
    client.contextMenus.set(context.data.name, context);
}

client.selectMenus = new Collection();
const selectMenus = fs.readdirSync("./interactions/selectmenus").filter((file) => file.endsWith(".mjs"));
for (const file of selectMenus) {
	const select = await import(`./interactions/selectmenus/${file}`);
	client.selectMenus.set(select.customId, select);
}

client.commands = new Collection();
const messageFiles = fs.readdirSync("./commands").filter((file) => file.endsWith(".mjs"));
for (const file of messageFiles) {
	const command = await import(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

client.login(process.env["TOKEN"]).catch(console.error);

process.on("uncaughtException", console.error);
