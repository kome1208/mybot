import { data as command } from "../../user.mjs";
import { EmbedBuilder } from "discord.js";

command.addSubcommand(subcmd =>
    subcmd.setName("avatar")
    .setDescription("ユーザーのアバター")
    .addUserOption(option =>
        option.setName("member")
        .setDescription("メンバーを選択")
    )
);

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    await interaction.deferReply();
    try {
        const id = interaction.options.getUser("member")?.id ?? interaction.user.id;
        
        const embed = new EmbedBuilder();

        if (interaction.inGuild()) {
            const member = await interaction.guild.members.fetch(id);

            embed
            .setTitle(`${member.user.username}のアバター`)
            .setDescription(`[グローバルアバター](${member.user.displayAvatarURL({ extension: "png", size: 4096 })})`)
            .setImage(member.displayAvatarURL({ extension: "png", size: 4096 }));
        } else {
            const user = await interaction.client.users.fetch(id);

            embed
            .setTitle(`${user.username}のアバター`)
            .setImage(user.displayAvatarURL({ extension: "png", size: 4096 }));
        }

        await interaction.editReply({ embeds: [ embed ] });
    } catch (err) {
        await interaction.editReply({ content: "アバターの取得に失敗しました。" });
        console.error(err);
    }
};