import { SlashCommandBuilder } from "discord.js";
import { createCanvas } from "canvas";
import moment from "moment-timezone";

export const data = new SlashCommandBuilder()
.setName("year")
.setDescription("1年の進捗");

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    let content = "";
    const now = moment.tz("Asia/Tokyo");
    const start = moment.tz("Asia/Tokyo").set({ year: now.year(), month: 0, date: 1, hour: 0, minute: 0, second: 0, millisecond: 0 });
    const end = moment.tz("Asia/Tokyo").set({ year: now.year()+1, month: 0, date: 1, hour: 0, minute: 0, second: 0, millisecond: 0 });
    
    const progress = (now-start) / (end-start);
    
    if (now.month() === 0 && now.date() === 1 && now.hour() === 0 && now.minute() === 0) content += `${now.year() - 1}年は100%終了しました。`;
    else content += `${now.year()}年は${Math.floor(progress*100)}%終了しました`;
    
    const canvas = createCanvas(1000, 200);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeRect(25, 25, canvas.width - 25 * 2, canvas.height - 25 * 2);
    
    ctx.fillStyle = "#000000";
    ctx.fillRect(50, 50, canvas.width - 50 * 2, canvas.height - 50 * 2);
    
    ctx.fillStyle = "#00ff00";
    ctx.fillRect(50, 50, (canvas.width - 50 * 2) * progress, canvas.height - 50 * 2);
    
    const data = canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
    
    await interaction.reply({ content, files: [ { attachment: Buffer.from(data, "base64"), name: "progress.png" } ] });
};