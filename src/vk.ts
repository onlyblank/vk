import { VK } from 'vk-io';

import config from './config';

const vk = new VK({
	token: config.ACCESS_TOKEN,
	webhookConfirmation: config.CONFIRMATION_TOKEN,
	webhookSecret: config.SECRET_TOKEN,
});

const vk_user = new VK({
	token: config.USER_TOKEN,
});

export { vk, vk_user };