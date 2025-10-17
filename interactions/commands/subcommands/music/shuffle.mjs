import { MessageFlags } from "discord.js";
import { data as command } from "../../music.mjs";
import { useQueue } from "discord-player";

command.addSubcommand(subcmd =>
    subcmd.setName("shuffle")
    .setDescription("キューをシャッフル再生")
);

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    const queue = useQueue(interaction.guildId);
    if (!interaction.member.voice.channel) return interaction.reply({ content: "ボイスチャンネルに参加してください", flags: [ MessageFlags.Ephemeral ] });
    if (!queue || (!queue.tracks.at(0) && !queue.currentTrack)) return interaction.reply({ content: "音楽が再生されていません。", flags: [ MessageFlags.Ephemeral ] });
    queue.toggleShuffle();
    await interaction.reply({ content: `🔀シャッフルを${queue.isShuffling ? "有効" : "無効"}にしました` });
};