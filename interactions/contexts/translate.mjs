import { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import * as deepl from "deepl-node";

export const data = new ContextMenuCommandBuilder()
.setName("日本語に翻訳")
.setType(ApplicationCommandType.Message);

/**
 * 
 * @param {import("discord.js").MessageContextMenuCommandInteraction} interaction 
 * @returns 
 */
export const run = async (interaction) => {
    await interaction.deferReply();
    const targetId = interaction.targetId;
    const message = await interaction.channel.messages.fetch(targetId);
    if (!message.content) 
        return await interaction.editReply({ content: "選択したメッセージに内容がありません。" });
     else {
        try {
            const authKey = process.env["DEEPL_API_KEY"];
            const deeplClient = new deepl.DeepLClient(authKey);

            const result = await deeplClient.translateText(message.content, null, "ja");
            
            const embed = new EmbedBuilder()
            .setDescription(result.text)
            .setColor("White")
            .setFooter({ text: "Powered by DeepL" });
            const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setLabel("オリジナル")
                .setStyle(ButtonStyle.Link)
                .setURL(message.url)
            );
            await interaction.editReply({ embeds: [ embed ], components: [ button ] });
        } catch (err) {
            console.log(err);
        }
    }
};