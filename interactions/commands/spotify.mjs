import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder } from "discord.js";
import moment from "moment";
import Spotify from "spotify-web-api-node";

export const data = new SlashCommandBuilder()
.setName("spotify")
.setDescription("spotify")
.addStringOption((option) =>
    option.setName("query")
    .setDescription("検索クエリ")
    .setRequired(true)
);
    
/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    const spotify = new Spotify({
        clientId: process.env["SPOTIFY_CLIENT_ID"],
        clientSecret: process.env["SPOTIFY_CLIENT_SECRET"]
    });

    await interaction.deferReply();

    if ((global?.spotify?.expiresIn ?? 0) <= Date.now()) {
        const { body } = await spotify.clientCredentialsGrant();

        global.spotify = {
            accessToken: body["access_token"],
            expiresIn: Date.now() + body["expires_in"] * 1000
        };
    }

    spotify.setAccessToken(global.spotify.accessToken);

    spotify.search(
        interaction.options.getString("query"),
        [ "track", "artist", "album" ],
        {
            market: "JP",
            limit: 25
        },
        async (error, response) =>{
            if (error) {
                console.error(error);
                await interaction.editReply({ content: "取得出来ませんでした。" });
                return;
            }

            let currentResultType = "track";

            const embeds = {
                track: response.body.tracks.items.map((track) =>
                    new EmbedBuilder()
                    .setTitle(track.name.slice(0, 99))
                    .setURL(track.external_urls.spotify)
                    .setThumbnail(track.album.images[0]?.url || null)
                    .setFields([
                        { name: "アーティスト", value: track.artists.map((artist) => `[${artist.name}](${artist.external_urls.spotify})`).join(", ").slice(0, 99) },
                        { name: "アルバム", value: `[${track.album.name}](${track.album.external_urls.spotify})` },
                        { name: "再生時間", value: `${moment(track.duration_ms).format("m:ss")}` }
                    ])
                    .setColor("Green")
                ),
                artist: response.body.artists.items.map((artist) =>
                    new EmbedBuilder()
                    .setTitle(artist.name.slice(0, 99))
                    .setURL(artist.external_urls.spotify)
                    .setImage(artist.images[0]?.url || null)
                    .setColor("Green")
                ),
                album: response.body.albums.items.map((album) =>
                    new EmbedBuilder()
                    .setTitle(album.name.slice(0, 99))
                    .setURL(album.external_urls.spotify)
                    .setThumbnail(album.images[0]?.url || null)
                    .setFields([
                        { name: "アーティスト", value: album.artists.map((artist) => `[${artist.name}](${artist.external_urls.spotify})`).join(", ").slice(0, 99) },
                        { name: "トラック数", value: album.total_tracks.toString() },
                        { name: "リリース日", value: album.release_date }
                    ])
                    .setColor("Green")
                )
            };

            const resultTypeButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setLabel("トラック")
                .setCustomId("result_track")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
                new ButtonBuilder()
                .setLabel("アーティスト")
                .setCustomId("result_artist")
                .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                .setLabel("アルバム")
                .setCustomId("result_album")
                .setStyle(ButtonStyle.Primary)
            );

            const reply = await interaction.editReply({
                embeds: [
                    embeds.track[0]
                ],
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                        .setCustomId("select_result")
                        .setPlaceholder("選択")
                        .addOptions(
                            response.body.tracks.items.map((track, i) => ({
                                label: track.name,
                                value: i.toString()
                            }))
                        )
                    ),
                    resultTypeButtons
                ]
            });

            const filter = ({ user }) => {
                return user.id === interaction.user.id;
            };
    
            const collector = reply.createMessageComponentCollector({ filter, time: 900000 });
            
            collector
            .on("collect", async (interaction) => {
                if (interaction.customId === "select_result") {
                    await interaction.update({
                        embeds: [
                            embeds[currentResultType][interaction.values[0]]
                        ],
                        components: [
                            new ActionRowBuilder()
                            .addComponents(
                                new StringSelectMenuBuilder()
                                .setCustomId("select_result")
                                .setPlaceholder("選択")
                                .addOptions(
                                    embeds[currentResultType].map((track, i) => ({
                                        label: track.data.title.slice(0, 99),
                                        value: i.toString()
                                    }))
                                )
                            ),
                            resultTypeButtons
                        ]
                    });
                } else if (interaction.customId.startsWith("result_")) {
                    const resultType = interaction.customId.split("_")[1];

                    currentResultType = resultType;

                    await interaction.update({
                        embeds: [
                            embeds[resultType][0]
                        ],
                        components: [
                            new ActionRowBuilder()
                            .addComponents(
                                new StringSelectMenuBuilder()
                                .setCustomId("select_result")
                                .setPlaceholder("選択")
                                .addOptions(
                                    embeds[resultType].map((item, i) => ({
                                        label: item.data.title,
                                        value: i.toString()
                                    }))
                                )
                            ),
                            resultTypeButtons.setComponents(
                                resultTypeButtons.components.map((button) => {
                                    return button.setDisabled(button.data.custom_id === interaction.customId);
                                })
                            )
                        ]
                    });
                }
            })
            .on("end", async () => {});
        }
    );
};