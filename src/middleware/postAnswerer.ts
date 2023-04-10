import axios from 'axios';

import config from '../config';
import Post from '../models/Post';
import { vk } from '../vk';


let isAnswering = false;

export const postAnswerer = async (context, next) => {

	if(isAnswering){
		await next();
		return;
	}
	isAnswering = true;

	const hour_ms = 60*60*1000;
	// About two days before now
	const dateAfterAnsweredPosts = new Date(Date.now() - 47 * hour_ms);

	// Run asynchronously.
	axios.get(config.API_URL + '/vk-wall-posts?answered=false&created_at_lt='+dateAfterAnsweredPosts.toISOString())
		.then(request => request.data)
		.then(async (data : Post[]) => {
			const patchedPostsIds : number[] = [];

			for(const post of data){
				await (
					axios.put(config.API_URL + '/vk-wall-posts/' + post.id, { 
						answered: true,
					},{
						headers: {
						  	Authorization: 'Bearer ' + (await config.API_JWT),
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
						message: "⚡Правильный ответ⚡\n" +"v\n".repeat(8) + post.task.answer,
						owner_id: -context.$groupId,
					});
				}
			}
		})
		.finally(() => isAnswering = false);

	
	await next();
}