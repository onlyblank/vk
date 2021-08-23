import axios from 'axios';
import * as dotenv from 'dotenv';

import { Config, variables } from './configTypes';

let cachedConfig : Config | null = null;

export default async function config() : Promise<Config>{
	if(cachedConfig !== null)
		return cachedConfig;

	dotenv.config();

	const config: Partial<Config> = {};
	for(const key of variables)
		config[key] = process.env[key];
		
	const missingVariables = Object.entries(config).filter(pair => !pair[1]);
	if(missingVariables.length != 0){
		const keys = missingVariables.map(pair => pair[0]);
		throw new TypeError("Some environment variables are undefined: " 
			+ keys.join(',') 
			+ ". Define them in .env file");
	}

	if(config.API_URL.endsWith('/'))
		throw new TypeError("environment variable API_URL shouldn't end with '/'");

	try {
		const request = await axios.post(config.API_URL + '/auth/local', {
			identifier: config.API_LOGIN,
			password: config.API_PASSWORD,
		});

		if(!request.data.jwt)
			throw new Error("server didn't return the JWT token");

		config.API_JWT = request.data.jwt;
	}
	catch(err) {
		throw new Error("Error while getting JWT token: " + err.message);
	}

	process.env = cachedConfig = config as Config;

	return config as Config;
}
