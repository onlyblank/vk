import type { RequestHandler } from 'express';

import config from '../config';
import { vk } from '../vk';

const previousEventIds : string[] = []; 

export const vkWebhook : RequestHandler = async (req, res) =>{
	if (req.body.secret !== undefined && config.SECRET_TOKEN !== req.body.secret) {
		res.writeHead(403);
		res.end();
		return;
	}

	if(req.body.type === "confirmation"){
		res.end(config.CONFIRMATION_TOKEN);
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
};