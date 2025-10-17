import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from "discord.js";

export const name = "playerStart";
export const player = true;

/**
 * @param {import("discord-player").GuildQueue} queue
 * @param {import("discord-player").Track} track
 */
export const execute = async (queue, track) => {
    if (queue.metadata.intervalId) clearInterval(queue.metadata.intervalId);
    const component = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
        .setLabel("スキップ")
        .setStyle(ButtonStyle.Danger)
        .setCustomId("skip")
    );

    const reply = await queue.metadata.channel.send({ content: `🎶再生開始: \`${track.title}\``, components: [ component ] });
    reply.awaitMessageComponent({ time: track.durationMS - 1000 })
    .then(async (interaction) => {
        if (!interaction.member.voice.channel) return interaction.reply({ content: "ボイスチャンネルに参加してください", flags: [ MessageFlags.Ephemeral ] });
        if (interaction.customId === "skip") {
            queue.node.skip();
            interaction.reply({ content: `⏩\`${track.title}\`をスキップしました。(実行者:${interaction.user.username})` });
        }
    }).catch((err) => {console.log(err);});
};
