import axios from 'axios';

import config from '../config';
import { vk, vk_user } from '../vk';


function buildMessage(fromId: number, userName: string, isGuessCorrect: boolean  ): string{
	return `[id${fromId}|${userName}], ${isGuessCorrect ? "✔️" : "❌"}`;
}

type StrapiEntity<T extends { id: number }> = {
  data: {
    id: number;
    attributes: Omit<T, 'id'>;
  };
};

type StrapiEntityList<T extends { id: number }> = {
  data: {
    id: number;
    attributes: Omit<T, 'id'>;
  }[];
};

type VKWallPostDTO = StrapiEntityList<{
  id: number;
  task: StrapiEntity<{
    id: number;
    answer: [
      {
        id: number;
        text: string;
      }
    ];
  }>;
}>;

async function getPostAnswer(post_id: number): Promise<string> {
  return axios
    .get<VKWallPostDTO>(
      `${config.API_URL}/vk-wall-posts?where[post_id]=${post_id}&populate[task][populate]=answer`,
      {
        headers: {
          Authorization: `Bearer ${await config.API_JWT}`
        }
      }
    )
    .then(({ data }) => data)
    .then((dto) => dto.data[0].attributes.task.data.attributes.answer[0].text);
}

export const commentAnswerChecker = async (context, next) => {
	const guess = context.text;
const answer = await getPostAnswer(context.objectId);


	const isGuessCorrect = answer == guess;

	const user = (await vk.api.users.get({
		user_ids: context.fromId.toString(),
	}))[0];

	const message = buildMessage( context.fromId, user.first_name, isGuessCorrect );
	
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
