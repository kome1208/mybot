/* eslint-disable no-unused-vars */
import { codeBlock, escapeCodeBlock } from "discord.js";
import * as Discord from "discord.js";
import * as voice from "@discordjs/voice";
import util from "util";
import fs from "fs";
import got from "got";

export const data = {
    name: "eval",
    description: "きけん",
    type: "owner"
};


/**
 * 
 * @param {import("discord.js").Message} message 
 * @returns 
 */
export const run = async (message) => {
    const codeBlocks = /^`{3}(?<lang>[a-z]+)\n(?<code>[\s\S]+)\n`{3}$/mu;
    const langs = [ "js", "javascript" ];
    if (message.author.id !== process.env["OWNERID"]) return;
    if (!codeBlocks.test(message.content)) return;
    const { lang, code } = message.content.match(codeBlocks)?.groups ?? {};
    if (!langs.includes(lang)) return;
    const result = new Promise((resolve) => resolve(eval(code)));
    return result
    .then(async (output) => {
        if (typeof output !== "string") 
            output = util.inspect(output, { depth: 0 });
        
        if (output.includes(message.client.token)) 
            output = output.replace(message.client.token, "[TOKEN]");
        
        if (output.length > 1980) {
            message.reply({
                content: "実行結果が長すぎます。",
                files: [
                new Discord.AttachmentBuilder(Buffer.from(output, "utf8"), "result.txt")
                ]
            });
        } else 
            message.reply({ content: `\`\`\`\n${output}\n\`\`\`` });
        
    })
    .catch(async (err) => {
        err = err.toString();
        if (err.includes(message.client.token)) 
            err = err.replace(message.client.token, "[TOKEN]");
            message.reply({ content: `\`\`\`\n${err}\n\`\`\`` });
    });
};