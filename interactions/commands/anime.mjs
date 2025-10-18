import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import got from "got";
import { JSDOM } from "jsdom";

export const data = new SlashCommandBuilder()
.setName("anime")
.setDescription("dアニメから取得")
.addSubcommand(command =>
    command.setName("search")
    .setDescription("アニメを検索")
    .addStringOption(option =>
        option.setName("query")
        .setDescription("検索クエリを入力")
        .setRequired(true)
        .setAutocomplete(true)
    )
);

/**
 * 
 * @param {import("discord.js").ChatInputCommandInteraction} interaction 
 */
export const run = async (interaction) => {
    const subcommand = interaction.options.getSubcommand(true);
    
    if (subcommand === "search") {
        await interaction.deferReply();
        const query = interaction.options.getString("query");

        const response = await got.get(`https://animestore.docomo.ne.jp/animestore/rest/WS000105?length=25&searchKey=${encodeURIComponent(query)}`).json();
        
        const selectMenu = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
            .setCustomId("select_title")
            .setPlaceholder("タイトルを選択")
            .addOptions(
                response["data"]["workList"].map((work) =>
                    new StringSelectMenuOptionBuilder()
                    .setLabel(work["workInfo"]["workTitle"].length > 100 ? work["workInfo"]["workTitle"].slice(0, 97) + "..." : work["workInfo"]["workTitle"])
                    .setValue(work["workId"])
                )
            )
        );

        const elements = await getAnimeInfo(response["data"]["workList"][0]["workId"]);

        const seriesInfo = elements.find((element) => element["@type"] === "TVSeries");

        const showEpisodeButton = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId("show_episode")
            .setStyle(ButtonStyle.Primary)
            .setLabel("エピソードを表示")
        );

        const reply = await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                .setTitle(seriesInfo.name)
                .setURL(seriesInfo.url)
                .setDescription(seriesInfo.description || null)
                .setFields(
                    { name: "エピソード数", value: seriesInfo.numberOfEpisodes, inline: true },
                    { name: "ジャンル", value: seriesInfo.genre.join(", "), inline: true }
                )
                .setImage(seriesInfo.thumbnailUrl)
                .setColor("Orange")
            ],
            components: [ selectMenu, showEpisodeButton ]
        });

        const filter = ({ user }) => {
            return user.id === interaction.user.id;
        };

        const collector = reply.createMessageComponentCollector({ filter, time: 900000 });
        
        collector
        .on("collect", async (interaction) => {
            if (interaction.customId === "select_title") {
                const elements = await getAnimeInfo(interaction.values[0]);

                const seriesInfo = elements.find((element) => element["@type"] === "TVSeries");

                await interaction.update({
                    embeds: [
                        new EmbedBuilder()
                        .setTitle(seriesInfo.name)
                        .setURL(seriesInfo.url)
                        .setDescription(seriesInfo.description || null)
                        .setFields(
                            { name: "エピソード数", value: seriesInfo.numberOfEpisodes, inline: true },
                            { name: "ジャンル", value: seriesInfo.genre.join(", "), inline: true }
                        )
                        .setImage(seriesInfo.thumbnailUrl)
                        .setColor("Orange")
                    ],
                    components: [ selectMenu ]
                });
            } else if (interaction.customId === "show_episode") {
                await interaction.deferReply();

                const episodeInfo = await got.get(`https://animestore.docomo.ne.jp/animestore/rest/WS030101?partId=${elements.find((element) => element["@type"] === "TVEpisode")["@id"]}&_=${Date.now()}`, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0"
                    }
                }).json();

                const reply = await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                        .setTitle(`${episodeInfo.partDispNumber} ${episodeInfo.partTitle}`)
                        .setURL(`https://animestore.docomo.ne.jp/animestore/ci_pc?workId=${episodeInfo.workId}&partId=${episodeInfo.partId}`)
                        .setDescription(episodeInfo.partExp || null)
                        .setFields(
                            { name: "再生時間", value: episodeInfo.partMeasure, inline: true }
                        )
                        .setImage(episodeInfo.mainScenePath)
                        .setColor("Orange")
                    ],
                    components: [
                        new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                            .setCustomId("select_episode")
                            .setPlaceholder("エピソードを選択")
                            .addOptions(
                                elements.filter((element) => element["@type"] === "TVEpisode").slice(0, 25).map((element) =>
                                    new StringSelectMenuOptionBuilder()
                                    .setLabel(`${element.episodeNumber} ${element.name}`)
                                    .setValue(element["@id"])
                                )
                            )
                        )
                    ]
                });

                reply.createMessageComponentCollector({ filter, time: 900000 })
                .on("collect", async (interaction) => {
                    if (interaction.customId === "select_episode") {
                        const episodeInfo = await got.get(`https://animestore.docomo.ne.jp/animestore/rest/WS030101?partId=${interaction.values[0]}&_=${Date.now()}`, {
                            headers: {
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0"
                            }
                        }).json();

                        await interaction.update({
                            embeds: [
                                new EmbedBuilder()
                                .setTitle(`${episodeInfo.partDispNumber} ${episodeInfo.partTitle}`)
                                .setURL(`https://animestore.docomo.ne.jp/animestore/ci_pc?workId=${episodeInfo.workId}&partId=${episodeInfo.partId}`)
                                .setDescription(episodeInfo.partExp || null)
                                .setFields(
                                    { name: "再生時間", value: episodeInfo.partMeasure, inline: true }
                                )
                                .setImage(episodeInfo.mainScenePath)
                                .setColor("Orange")
                            ]
                        });
                    }
                });
            }
        })
        .on("end", async () => {});
    }
};

async function getAnimeInfo(workId) {
    const pageData = await got.get(
        `https://animestore.docomo.ne.jp/animestore/ci_pc?workId=${workId}`,
        {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0"
            }
        }
    );

    const dom = new JSDOM(pageData.body);
    const document = dom.window.document;

    const ldElements = Array.from(document.querySelectorAll("script[type=\"application/ld+json\"]"))
    .map((element) => JSON.parse(element.textContent));

    return ldElements;
}

/**
 * 
 * @param {import("discord.js").AutocompleteInteraction} interaction 
 */
export const runAutocomplete = async (interaction) => {
    if (interaction.options.getSubcommand("search")) {
        const query = interaction.options.getString("query");

        if (query) {
            const response = await got.get(`https://api.animestore.docomo.ne.jp/suggest?q=${encodeURIComponent(query)}&uid=anime&type=17`).json();

            const keywords = response["suggestions"].map((suggest) => ({ name: suggest["keyword"], value: suggest["keyword"] })).slice(0, 25);

            await interaction.respond(keywords);
        }
    }
};