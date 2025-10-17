import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import got from "got";
import { JSDOM } from "jsdom";

export const data = new SlashCommandBuilder()
.setName("yahoo")
.setDescription("yahoo検索")
.addStringOption(option =>
    option.setName("query")
    .setDescription("検索クエリ")
    .setRequired(true)
);

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    await interaction.deferReply();
    const query = interaction.options.getString("query");
    try {
        const data = await got.get(
            `https://search.yahoo.co.jp/search?p=${encodeURIComponent(query)}`,
            {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0"
                }
            }
        ).text();

        const document = new JSDOM(data).window.document;

        const aiMarkdown = document.querySelector("div.AnswerGenerativeAIMarkdown");

        const results = Array.from(document.querySelectorAll("div.sw-CardBase > div.sw-Card.Algo.Algo-anotherSuggest > section > div.sw-Card__section.sw-Card__section--header > div.sw-Card__headerSpace > div.sw-Card__title"))
        .slice(0, 5)
        .map((result, i) => 
            `${i+1}. [${result.querySelector("h3.sw-Card__titleMain.sw-Card__titleMain--clamp.sw-Card__titleMain--cite.util-Clamps--2")?.textContent}](${result.querySelector("a.sw-Card__titleInner")?.getAttribute("href")})`
        );

        if (!results.length) return interaction.editReply({ content: "検索結果が見つかりません。" });
        
        const embed = new EmbedBuilder()
        .setTitle(`「${query}」の検索結果`)
        .setURL(`https://search.yahoo.co.jp/search?p=${encodeURIComponent(query)}`)
        .setDescription(results.join("\n"));

        const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setLabel("AIの回答を表示")
            .setCustomId("show_ai_answer")
            .setStyle(ButtonStyle.Primary)
        );

        const reply = await interaction.editReply({
            embeds: [ embed ],
            components: aiMarkdown ? [ row ] : []
        });

        if (aiMarkdown) {
            reply.createMessageComponentCollector({
                filter: (i) => i.customId === "show_ai_answer"
            }).on("collect", async (interaction) => {
                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                        .setTitle("AIによる回答")
                        .setDescription(aiMarkdown.textContent)
                    ],
                    flags: [
                        MessageFlags.Ephemeral
                    ]
                });
            })
            .on("end", () => null);
        }
    } catch (err) {
        console.error(err);
        await interaction.editReply({ content: "取得出来ませんでした。" });
    }
};