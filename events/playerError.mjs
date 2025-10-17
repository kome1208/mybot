export const name = "playerError";
export const player = true;
export const execute = async (queue, error) => {
    console.log(error);
    await queue.metadata.channel.send({
        content: "Error"
    });
};