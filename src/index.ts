import axios from 'axios';
import express from 'express';
import { VK } from 'vk-io';

import config_environment from './config';
import Post from './models/Post';

// JWT token is stored here.
const config = config_environment();

const app = express();
app.use(express.json());
const vk = new VK({
	token: process.env.ACCESS_TOKEN,
	webhookConfirmation: process.env.CONFIRMATION_TOKEN,
	webhookSecret: process.env.SECRET_TOKEN,
});

const vk_user = new VK({
	token: process.env.USER_TOKEN,
});


// Error handling.
vk.updates.use(async (_context, next) => {
	try{
		await next();
	}
	catch(error){
		console.error("Error: " + error.message);
	}
});


// Add answers to posts.
let isAnswering = false;
vk.updates.use(async (context, next) => {

	if(isAnswering){
		await next();
		return;
	}
	isAnswering = true;

	const hour_ms = 60*60*1000;
	// About a day before now
	const dateAfterAnsweredPosts = new Date(Date.now() - 23 * hour_ms);

	// Run asynchronously.
	axios.get(process.env.API_URL + '/posts?answered=false&created_at_lt='+dateAfterAnsweredPosts.toISOString())
		.then(request => request.data)
		.then(async (data : Post[]) => {
			const patchedPostsIds : number[] = [];

			for(const post of data){
				await (
					axios.put(process.env.API_URL + '/posts/' + post.id, { 
						answered: true,
					},{
						headers: {
						  	Authorization: 'Bearer ' + (await config).API_JWT,
						},
					})
					.then(() => patchedPostsIds.push(post.id))
					.catch((err) => console.error(`Error during setting post#${post.post_id} 'answered' flag: ${err.message}`))
				);
			}

			for(const post of data){
				if(patchedPostsIds.includes(post.id)){
					// Run asynchronously.
					vk.api.wall.createComment({
						post_id: post.post_id,
						message: "⚡Правильный ответ⚡\n" + post.task.answer,
						owner_id: -context.$groupId,
					});
				}
			}
		})
		.finally(() => isAnswering = false);

	
	await next();
});

vk.updates.on("wall_reply_new", async (context, next) => {
	// Filter comments with text.
	// Filter comments that are not from this group.
	// Filter comments that was written by person.
	if(context.text && context.fromId !== -context.$groupId && !context.isGroup)
		next();
});

vk.updates.on("wall_reply_new", async (context) => {
	const guess = context.text;
	
	const response = await axios.get(process.env.API_URL + `/posts/${context.objectId}/answer`);
	const answer = response.data.answer;
	const isGuessCorrect = new RegExp(`^${answer}$`).test(guess);
	const user = (await vk.api.users.get({
		user_ids: context.fromId.toString(),
	}))[0];


	const message = `[id${context.fromId}|${user.first_name}], ${isGuessCorrect ? "✔️" : "❌"}`
	
	await vk.api.wall.createComment({
		owner_id: -process.env.GROUP_ID,
		post_id: context.objectId,
		message: message,
		reply_to_comment: context.id,
		from_group: +process.env.GROUP_ID,
	});

	if(isGuessCorrect)
		await vk_user.api.wall.deleteComment({
			owner_id: -process.env.GROUP_ID,
			comment_id: context.id,
		});

});


// VK api endpoint.
const previousEventIds : string[] = []; 
app.post('/super-secret-webhook-path', async (req, res) => {
	if (req.body.secret !== undefined && process.env.SECRET_TOKEN !== req.body.secret) {
		res.writeHead(403);
		res.end();
		return;
	}

	if(req.body.type === "confirmation"){
		res.end(process.env.CONFIRMATION_TOKEN);
		return;
	}

	res.end('ok');

	if(previousEventIds.includes(req.body.event_id) )
		return;
	
	// Checks for duplicated events.
	if(req.body.event_id)
		previousEventIds.push(req.body.event_id);
	if(previousEventIds.length > 6)
		previousEventIds.shift();
	
	console.log(`${req.body.type} [${req.body.event_id}]`)

	vk.updates.handleWebhookUpdate(req.body);
});

app.post('/post', async (req, res) => {
	// TODO: authentication.
	const imageDataUrl = req.body.imageDataUrl;
	const message = req.body.message;
	const imageBuffer = Buffer.from(imageDataUrl, 'base64');
	
	const photoAttachment = await vk_user.upload.wallPhoto({
		group_id: +process.env.GROUP_ID,
		source: {
			value: imageBuffer,
			contentLength: imageBuffer.length,
		}
	});

	const response = await vk_user.api.wall.post({
		owner_id: -process.env.GROUP_ID,
		message: message,
		from_group: true,
		signed: 0,
		attachments: [photoAttachment.toString()]
	});

	res.json({
		post_id: response.post_id
	});

});


app.listen(+process.env.PORT, () => {
	console.log(`Express app started at port ${process.env.PORT}`);
});