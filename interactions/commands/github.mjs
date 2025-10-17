import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, EmbedBuilder, MessageFlags, SectionBuilder, SlashCommandBuilder, StringSelectMenuBuilder, TextDisplayBuilder } from "discord.js";
import got from "got";
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";

export const data = new SlashCommandBuilder()
.setName("github")
.setDescription("githubいろいろ")
.addSubcommand((command) =>
    command.setName("search")
    .setDescription("GitHub上の特定の項目を検索します")
    .addStringOption((option) =>
        option.setName("query")
        .setDescription("検索クエリ")
        .setRequired(true)
    )
    .addStringOption((option) =>
        option.setName("type")
        .setDescription("検索する項目(デフォルト: リポジトリ)")
        .setChoices([
            { name: "リポジトリ", value: "repo" },
            { name: "ユーザー", value: "user" }
        ])
    )
);

const apiBaseUrl = "https://api.github.com";
const headers =  {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${process.env["GITHUB_TOKEN"]}`
};

const languages = JSON.parse(readFileSync("assets/languages.json", "utf8"));

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "search") {
        const query = interaction.options.getString("query");
        const contentType = interaction.options.getString("type", false) ?? "repo";
        await interaction.deferReply();

        if (contentType === "user") {
            const response = await got.get(`${apiBaseUrl}/search/users`, {
                searchParams: {
                    "q": query
                },
                headers
            }).json();

            const selectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                .setCustomId("select_user")
                .setPlaceholder("ユーザーを選択")
                .addOptions(
                    response.items.slice(0, 25).map((item, i) => ({
                        label: item.login.length >= 100 ? item.login.slice(0, 97) + "..." : item.login,
                        value: `${i}`
                    }))
                )
            );

            const reply = await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                    .setDescription("ユーザーを選択してください")
                    .setColor("Grey")
                ],
                components: [ selectMenu ]
            });

            const collector = reply.createMessageComponentCollector({
                filter: ({ user }) => user.id === interaction.user.id,
                time: 900_000
            });

            collector.on("collect", async (interaction) => {
                const userInfo = await got.get(response.items[interaction.values[0]].url, {
                    headers
                }).json();

                const embed = new EmbedBuilder()
                .setTitle(userInfo.login)
                .setURL(userInfo.html_url)
                .setDescription(userInfo.bio)
                .setFields(
                    { name: "フォロワー数", value: `${userInfo.followers}`, inline: true },
                    { name: "フォロー中", value: `${userInfo.following}`, inline: true },
                    { name: "場所", value: `${userInfo.location ?? "無し"}`, inline: true },
                    { name: "Xリンク", value: `${!userInfo.twitter_username ? "無し" : `https://x.com/${userInfo.twitter_username}`}`, inline: true },
                    { name: "公開リポジトリ数", value: `${userInfo.public_repos}`, inline: true },
                    { name: "公開gist数", value: `${userInfo.public_gists}`, inline: true },
                    { name: "作成日時", value: `<t:${Math.floor(new Date(userInfo.created_at).getTime() / 1000)}>`, inline: true },
                    { name: "更新日時", value: `<t:${Math.floor(new Date(userInfo.updated_at).getTime() / 1000)}>`, inline: true }
                )
                .setThumbnail(userInfo.avatar_url);
                
                await interaction.update({
                    embeds: [ embed ]
                });
            });
        } else if (contentType === "repo") {
            let currentIndex = 0;
            const response = await got.get(`${apiBaseUrl}/search/repositories`, {
                searchParams: {
                    "q": query
                },
                headers
            }).json();

            const embeds = response.items.map((item) => {
                return new EmbedBuilder()
                .setTitle(item.full_name.length >= 256 ? item.full_name.slice(0, 253) + "..." : item.full_name)
                .setURL(item.html_url)
                .setDescription(item.description)
                .setFields(
                    { name: "オーナー", value: `[${item.owner.login}](${item.owner.html_url})`, inline: true },
                    { name: "言語", value: item.language ?? "不明", inline: true },
                    { name: "ライセンス", value: item.license?.name ?? "不明", inline: true },
                    { name: "トピック", value: !item.topics.length ? "無し" : item.topics.join(", "), inline: true }
                )
                .setColor(languages[item.language]?.color ?? null);
            });

            const selectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                .setCustomId("select_repo")
                .setPlaceholder("リポジトリを選択")
                .addOptions(
                    response.items.slice(0, 25).map((item, i) => ({
                        label: item.full_name.length >= 100 ? item.full_name.slice(0, 97) + "..." : item.full_name,
                        value: `${i}`
                    }))
                )
            );

            const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setLabel("アクションを表示")
                .setCustomId("show_actions")
                .setStyle(ButtonStyle.Primary)
            );

            const reply = await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                    .setDescription("リポジトリを選択してください")
                    .setColor("Grey")
                ],
                components: [ selectMenu ]
            });

            const collector = reply.createMessageComponentCollector({
                filter: ({ user }) => user.id === interaction.user.id,
                time: 900_000
            });

            collector.on("collect", async (interaction) => {
                if (interaction.customId === "select_repo") {
                    currentIndex = interaction.values[0];
                    interaction.update({
                        embeds: [
                            embeds[currentIndex].setImage(await getOGPImage(response.items[currentIndex].html_url))
                        ],
                        components: [
                            selectMenu,
                            buttons
                        ]
                    });
                } else if (interaction.customId === "show_actions") {
                    let currentWorkflowIndex = 0;
                    await interaction.deferReply();

                    const actions = await got.get(`${apiBaseUrl}/repos/${response.items[currentIndex].full_name}/actions/runs`, {
                        headers
                    }).json();

                    if (actions.total_count <= 0) {
                        return await interaction.editReply({
                            content: "このリポジトリにはActionsの実行履歴がありません"
                        });
                    }

                    const workflowRuns = actions.workflow_runs.map((item) => {
                        return new EmbedBuilder()
                        .setTitle(item.display_title.length >= 256 ? item.display_title.slice(0, 253) + "..." : item.display_title)
                        .setURL(item.html_url)
                        .setFields(
                            { name: "ブランチ", value: item.head_branch, inline: true },
                            { name: "ステータス", value: item.status, inline: true },
                            { name: "結果", value: item.conclusion, inline: true }
                        )
                        .setFooter({ text: `${item.name} #${item.run_number}: ${item.triggering_actor.login} によるコミット ${item.head_commit.id.slice(0, 7)}` });
                    });

                    const selectMenu = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                        .setCustomId("select_workflows")
                        .setPlaceholder("ワークフローを選択")
                        .addOptions(
                            actions.workflow_runs.slice(0, 25).map((item, i) => ({
                                label: item.display_title.length >= 100 ? item.display_title.slice(0, 97) + "..." : item.display_title,
                                value: `${i}`
                            }))
                        )
                    );

                    const buttons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setLabel("アーティファクトを表示")
                        .setCustomId("show_artifacts")
                        .setStyle(ButtonStyle.Primary)
                    );

                    const reply = await interaction.editReply({
                        embeds: [ workflowRuns[0] ],
                        components: [
                            selectMenu,
                            buttons
                        ]
                    });

                    const collector = reply.createMessageComponentCollector({
                        filter: ({ user }) => user.id === interaction.user.id,
                        time: 900_000
                    });

                    collector.on("collect", async (interaction) => {
                        if (interaction.customId === "select_workflows") {
                            currentWorkflowIndex = interaction.values[0];
                            interaction.update({
                                embeds: [ workflowRuns[interaction.values[0]] ]
                            });
                        } else if (interaction.customId === "show_artifacts") {
                            await interaction.deferReply();

                            const artifacts = await got.get(`${actions.workflow_runs[currentWorkflowIndex].artifacts_url}`, {
                                headers
                            }).json();

                            if (artifacts.total_count <= 0) {
                                return await interaction.editReply({
                                    content: "このワークフローにはアーティファクトがありません"
                                });
                            }

                            const components = new ContainerBuilder()
                            .addTextDisplayComponents({
                                content: `# Artifacts from ${artifacts.artifacts[0].workflow_run.head_sha.slice(0, 7)}`
                            })
                            .addSectionComponents(
                                artifacts.artifacts.map((item, i) =>
                                    new SectionBuilder()
                                    .addTextDisplayComponents(
                                        new TextDisplayBuilder({
                                            content: `${item.name}`
                                        }),
                                        new TextDisplayBuilder({
                                            content: `${formatBytes(item.size_in_bytes)}`
                                        })
                                    )   
                                    .setButtonAccessory(
                                        new ButtonBuilder()
                                        .setCustomId(`download_artifact_${i}`)
                                        .setLabel("入手")
                                        .setStyle(ButtonStyle.Primary)
                                    )
                                )
                            );

                            const reply = await interaction.editReply({
                                components: [ components ],
                                flags: MessageFlags.IsComponentsV2
                            });

                            const collector = reply.createMessageComponentCollector({
                                filter: ({ user }) => user.id === interaction.user.id,
                                time: 900_000
                            });

                            collector.on("collect", async (interaction) => {
                                await interaction.deferReply();
                                const headRes = await got.get(artifacts.artifacts[interaction.customId.replace("download_artifact_", "")].archive_download_url, {
                                    headers,
                                    followRedirect: false
                                });
                              
                                const redirectUrl = headRes.headers.location;

                                await interaction.editReply({
                                    content: `### [${artifacts.artifacts[interaction.customId.replace("download_artifact_", "")].name}](${redirectUrl})`
                                });
                            });
                        }
                    });
                }
            });
        }
    }
};

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 B";
  
    const k = 1024;
    const sizes = [ "B", "KB", "MB", "GB", "TB", "PB" ];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(decimals));
    return `${value} ${sizes[i]}`;
}

async function getOGPImage(url) {
    const response = await got.get(
        url,
        {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0"
            }
        }
    ).text();

    const { window: { document } } = new JSDOM(response);

    const imageDom = document.querySelector("meta[property=\"og:image\"]");
    
    return imageDom.getAttribute("content");
}