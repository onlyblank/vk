import axios from 'axios';

import config from '../config';
import { vk, vk_user } from '../vk';

export const commentAnswerChecker = async (context, next) => {
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

	// Delete an answer.
	await vk_user.api.wall.deleteComment({
		owner_id: -config.GROUP_ID,
		comment_id: context.id,
	});

	await next();
}