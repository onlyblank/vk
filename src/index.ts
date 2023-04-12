import express from 'express';

import config from './config';
import { 
	adminCommandExecutor, 
	commentAnswerChecker, 
	errorHandler, 
	postAnswerer, 
	postCreator, 
    vkWebhook,
} from './middleware';
import { vk } from './vk';

const app = express();
app.use(express.json({
	limit: "256mb"
}));

// Error handling.
vk.updates.use(errorHandler);

// Adds answers to posts.
vk.updates.use(postAnswerer);

// Admin `/delete` function.
vk.updates.on("wall_reply_new", adminCommandExecutor);


vk.updates.on("wall_reply_new", async (context, next) => {
	// Filter comments with text.
	// Filter comments that are not from this group.
	// Filter comments that was written by person.
	if(context.text && context.fromId !== -context.$groupId && !context.isGroup)
		await next();
});

// Checks if given answer is correct.
vk.updates.on("wall_reply_new", commentAnswerChecker);

// VK api endpoint.
app.post('/super-secret-webhook-path', vkWebhook);


app.post('/post', postCreator);


app.listen(+config.PORT, () => {
	console.log(`Express app started at port ${config.PORT}`);
});