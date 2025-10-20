import { ActionRowBuilder, ApplicationIntegrationType, EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import got from "got";
import { JSDOM } from "jsdom";

export const data = new SlashCommandBuilder()
.setName("image")
.setDescription("画像をyahooから検索")
.addStringOption(option =>
    option.setName("query")
    .setDescription("検索クエリ")
    .setRequired(true)
)
.setIntegrationTypes(
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall
);

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    await interaction.deferReply();
    const query = interaction.options.getString("query");

    try {
        const data = await got.get(`https://search.yahoo.co.jp/image/search?p=${encodeURIComponent(query)}`).text();
        const document = new JSDOM(data).window.document;
        const images = JSON.parse(document.querySelector("script#__NEXT_DATA__").firstChild.textContent).props.initialProps.pageProps.algos;
        if (!images.length) return interaction.editReply({ content: "検索結果が見つかりません。" });

        const embeds = images.slice(0, 25).map((image) => {
            return new EmbedBuilder()
            .setAuthor({ name: image.refererName, iconURL: image.faviconUrl })
            .setTitle(image.title)
            .setURL(image.refererUrl)
            .setImage(image.thumbnail.url);
        });

        const selectMenu = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
            .setCustomId("select_image")
            .setPlaceholder("画像を選択")
            .addOptions(
                images.slice(0, 25).map((image, i) => 
                    new StringSelectMenuOptionBuilder()
                    .setLabel(image.title.length >= 100 ? image.title.slice(0, 97) + "..." : image.title)
                    .setDescription(image.refererName.length >= 100 ? image.refererName.slice(0, 97) + "..." : image.refererName)
                    .setValue(`${i}`)
                )
            )
        );

        const reply = await interaction.editReply({
            embeds: [ embeds[0] ],
            components: [ selectMenu ]
        });

        const collector = reply.createMessageComponentCollector({
            filter: ({ user }) => user.id === interaction.user.id,
            time: 900_000
        });

        collector.on("collect", async (interaction) => {
            if (interaction.customId === "select_image") {
                interaction.update({
                    embeds: [ embeds[interaction.values[0]] ]
                });
            }
        });
    } catch (err) {
        console.error(err);
        await interaction.editReply({ content: "取得出来ませんでした。" });
    }
};