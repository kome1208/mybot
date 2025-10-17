import { data as command } from "../../guild.mjs";
import { EmbedBuilder } from "discord.js";

command.addSubcommand(subcmd =>
    subcmd.setName("icon")
    .setDescription("サーバーのアイコン")
);

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    await interaction.deferReply();
    try {
        const guild = await interaction.guild.fetch();
        
        const embed = new EmbedBuilder()
        .setTitle(`${guild.name}のサーバーアイコン`)
        .setImage(guild.iconURL({ extension: "png", size: 4096 }));

        await interaction.editReply({ embeds: [ embed ] });
    } catch (err) {
        await interaction.editReply({ content: "サーバー情報の取得に失敗しました。" });
        console.error(err);
    }
};