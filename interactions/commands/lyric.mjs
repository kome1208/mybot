import { ActionRowBuilder, ApplicationIntegrationType, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { JSDOM } from "jsdom";
import got from "got";
const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0"
};

export const data = new SlashCommandBuilder()
.setName("lyric")
.setDescription("うたてんから歌詞取得")
.addStringOption(option =>
    option.setName("query")
    .setDescription("検索する歌詞")
    .setRequired(true)
)
.addStringOption(option =>
    option.setName("artist")
    .setDescription("アーティストの指定")
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
    const artist = interaction.options.getString("artist");
    try {
        const searchPageData = await got.get(`https://utaten.com/search?sort=popular_sort_asc&artist_name=&title=${encodeURIComponent(query)}${artist ? "&artist_name=" + encodeURIComponent(artist) : ""}`, { headers }).text();
        const searchPage = new JSDOM(searchPageData).window.document;

        const resultTable = Array.from(searchPage.querySelectorAll("table.searchResult.artistLyricList > tbody > tr")).slice(1, 26);

        if (!resultTable.length) return interaction.editReply({ content: "楽曲が見つかりませんでした。" });

        const lyricList = resultTable.map((dom) => {
            const titleDom = dom.querySelector(".searchResult__title > a");
            const artistDom = dom.querySelector(".searchResult__artist > p > a");
            const lyricistDom = dom.querySelectorAll(".searchResult__lyricist > p > span.songWriters");

            const songWriters = Array.from(lyricistDom).map((e) => e.textContent.trim().replace(/\s/g, ""));

            return {
                title: titleDom.textContent.trim(),
                url: "https://utaten.com" + titleDom.getAttribute("href"),
                artist: artistDom.textContent.trim(),
                writers: songWriters[0] || null,
                lyricists: songWriters[1] || null,
                arrangers: songWriters[2] || null
            };
        });

        const selectMenu = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
            .setCustomId("select_song")
            .setPlaceholder("楽曲を選択")
            .addOptions(
                lyricList.map((item, i) => 
                    new StringSelectMenuOptionBuilder()
                    .setLabel(item.title.length >= 100 ? item.title.slice(0, 97) + "..." : item.title)
                    .setDescription(item.artist.length >= 100 ? item.artist.slice(0, 97) + "..." : item.artist)
                    .setValue(`${i}`)
                )
            )
        );

        const reply = await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                .setDescription("楽曲を選択してください")
                .setColor("Grey")
            ],
            components: [ selectMenu ]
        });

        const collector = reply.createMessageComponentCollector({
            filter: ({ user }) => user.id === interaction.user.id,
            time: 900_000
        });

        collector.on("collect", async (interaction) => {
            const selected = lyricList[interaction.values[0]];

            const lyricPageData = await got.get(selected.url, { headers }).text();
            const lyricPage = new JSDOM(lyricPageData).window.document;
            const lyricDom = Array.from(lyricPage.querySelectorAll(".romaji"), (item) => item.textContent.trim());
            const lyricrbDom = Array.from(lyricPage.querySelectorAll(".romaji > .ruby > .rb"), (item) => item.textContent.trim());
            let lyric = lyricDom.join("");
            lyricPage.querySelectorAll(".romaji > .ruby").forEach((x, i) => {
                const newKashi = lyric.replace(x.textContent.trim(), lyricrbDom[i]);
                lyric = newKashi;
            });
            const embed = new EmbedBuilder()
            .setTitle((selected.title.length > 45 ? selected.title.slice(0, 45) + "..." : selected.title) + " - " + (selected.artist.length > 45 ? selected.artist.slice(0, 45) + "..." : selected.artist) + "の歌詞")
            .setURL(selected.url)
            .setDescription(lyric.slice(0, 4096));

            const button = new ActionRowBuilder()
            .setComponents(
                new ButtonBuilder()
                .setLabel("この歌詞をUtaTenで見る")
                .setURL(selected.url)
                .setStyle(ButtonStyle.Link)
            );

            await interaction.update({
                embeds: [ embed ],
                components: [
                    selectMenu,
                    button
                ]
            });
        });
    } catch (err) {
        console.error(err);
        await interaction.editReply({ content: "歌詞の取得に失敗しました。" });
    }
};