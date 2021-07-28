import axios from 'axios';
import express from 'express';
import { RequestHandler } from 'express-serve-static-core';
import { VK } from 'vk-io';

import config from './config';

const app = express();
app.use(express.json());
const vk = new VK({
	token: config.ACCESS_TOKEN,
	webhookConfirmation: config.CONFIRMATION_TOKEN,
	webhookSecret: config.SECRET_TOKEN,
});

const vk_user = new VK({
	token: config.USER_TOKEN,
});

vk.updates.on("wall_reply_new", (context, next) => {
	// Filter comments with text.
	// Filter comments that are not from group.
	// Filter comments that was written by person. 
	if(context.text && context.fromId !== -context.$groupId && !context.isGroup)
		next();
});

vk.updates.on("wall_reply_new", async (_context, next) => {
	try{
		await next();
	}
	catch(error){
		console.error("Error: " + error.message);
	}
});

vk.updates.on("wall_reply_new", async (context) => {
	const guess = context.text;
	
	const response = await axios.get(config.API_URL + `/posts/${context.objectId}/answer`);
	const answer = response.data.answer;
	const isGuessCorrect = new RegExp(`^${answer}$`).test(guess);
	const user = (await vk.api.users.get({
		user_ids: context.fromId.toString(),
	}))[0];


	const message = `[id${context.fromId}|${user.first_name}], ${isGuessCorrect ? "✔️" : "❌"}`
	
	await vk.api.wall.createComment({
		owner_id: -config.GROUP_ID,
		post_id: context.objectId,
		message: message,
		reply_to_comment: context.id,
		from_group: +config.GROUP_ID,
	});

	await vk_user.api.wall.deleteComment({
		owner_id: -config.GROUP_ID,
		comment_id: context.id,
	});
	

});

app.post('/super-secret-webhook-path', vk.updates.getWebhookCallback() as RequestHandler);

app.post('/post', async (req, res) => {
	const imageDataUrl = req.body.imageDataUrl;
	const message = req.body.message;
	const imageBuffer = Buffer.from(imageDataUrl, 'base64');
	
	const photoAttachment = await vk_user.upload.wallPhoto({
		group_id: +config.GROUP_ID,
		source: {
			value: imageBuffer,
			contentLength: imageBuffer.length,
		}
	});

	const response = await vk_user.api.wall.post({
		owner_id: -config.GROUP_ID,
		message: message,
		from_group: true,
		signed: 0,
		attachments: [photoAttachment.toString()]
	})

	res.json({
		post_id: response.post_id
	});

});


app.listen(+config.PORT, () => {
	console.log(`Express app started at port ${config.PORT}`);
});