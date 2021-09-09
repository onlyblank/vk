import axios from 'axios';

import config from '../config';
import { vk_user } from '../vk';

export const adminCommandExecutor = async (context, next) => {
	// Only for admin. (Comment from group)
	if(context.fromId !== -config.GROUP_ID){
		return await next();
	}

	if(context.text === "/delete"){
		const post_id = context.objectId;
		try {
			const response = await axios.get(config.API_URL + `/posts?post_id=${post_id}`);
			const id = response.data[0].id;
			await axios.delete(config.API_URL + `/posts/${id}`,{
				headers: {
					Authorization: 'Bearer ' + (await config.API_JWT),
				},
			});
		}
		catch( err ){
			console.error(err.message);
		}

		// async operation, so i dont need to use try/catch.
		vk_user.api.wall.delete({
			owner_id: -config.GROUP_ID,
			post_id: post_id,
		})
	}

	return await next();
};