import { data as command } from "../../music.mjs";
import { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { useQueue } from "discord-player";

command.addSubcommand(subcmd =>
    subcmd.setName("remove-track")
    .setDescription("キュー内の曲を削除")
    .addIntegerOption(option =>
        option.setName("track")
        .setDescription("曲を選択")
        .setRequired(true)
        .setAutocomplete(true)
    )
);

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    const queue = useQueue(interaction.guildId);
    if (!interaction.member.voice.channel) return interaction.reply({ content: "ボイスチャンネルに参加してください", flags: [ MessageFlags.Ephemeral ] });
    if (!queue || (!queue.tracks.at(0) && !queue.currentTrack)) return interaction.reply({ content: "音楽が再生されていません。", flags: [ MessageFlags.Ephemeral ] });
    const removed = queue.removeTrack(interaction.options.getInteger("track") - 1);

    if (removed.metadata.isLineMusic) {
        removed.metadata?.stream?.kill();
        return interaction.reply({ content: `🚮\`${removed.title}\`をキューから削除しました。` });
    }

    const component = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
        .setStyle(ButtonStyle.Danger)
        .setLabel("取り消し")
        .setCustomId("readd")
    );
    const reply = await interaction.reply({ content: `🚮\`${removed.title}\`をキューから削除しました。`, components: [ component ] });
    reply.awaitMessageComponent({ filter: ({ customId, user }) => (customId === "readd" && user.id === interaction.user.id), time: 90000 })
    .then(interaction => {
        queue.addTrack(removed);
        const embed = new EmbedBuilder()
        .setAuthor({ name: "キューに再追加" })
        .setTitle(removed.title)
        .setURL(removed.url)
        .setThumbnail(removed.thumbnail)
        .addFields(
            { name: "チャンネル", value: `[${removed.raw.channel.name}](${removed.raw.channel.url})`, inline: true },
            { name: "時間", value: removed.duration, inline: true }
        )
        .setColor("ff0000");
        interaction.reply({ embeds: [ embed ] });
    })
    .catch(() => {});
};