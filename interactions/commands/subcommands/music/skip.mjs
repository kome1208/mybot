import { useQueue } from "discord-player";
import { data as command } from "../../music.mjs";
import { MessageFlags } from "discord.js";

command.addSubcommand(subcmd =>
    subcmd.setName("skip")
    .setDescription("再生中の曲をスキップ")
);

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    const queue = useQueue(interaction.guildId);
    if (!interaction.member.voice.channel) return interaction.reply({ content: "ボイスチャンネルに参加してください", flags: [ MessageFlags.Ephemeral ] });
    if (!queue || (!queue.tracks.at(0) && !queue.currentTrack)) return interaction.reply({ content: "音楽が再生されていません。", flags: [ MessageFlags.Ephemeral ] });
    const track = queue.currentTrack;
    queue.node.skip();
    await interaction.reply({ content: `⏩\`${track.title}\`をスキップしました。` });
};