import type { RequestHandler } from 'express';

import config from '../config';
import { vk_user } from '../vk';

export const postCreator : RequestHandler = async (req, res) => {
	// TODO: authentication.
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
	});

	res.json({
		post_id: response.post_id
	});

};