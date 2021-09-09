import axios from 'axios';
import * as dotenv from 'dotenv';

import { variables } from './configTypes';
import type { Config } from './configTypes';

dotenv.config();

const config: Partial<Config> = {};
for(const key of variables)
	config[key] = process.env[key];
	
const missingVariables = Object.entries(config).filter(pair => !pair[1]);
if(missingVariables.length != 0){
	const keys = missingVariables.map(pair => pair[0]);
	throw new TypeError("Some environment variables are not defined: " 
		+ keys.join(',') 
		+ ". Define them in .env file");
}

if(config.API_URL.endsWith('/'))
	throw new TypeError("environment variable API_URL shouldn't end with '/'");


// Authorise and recieve JWT token from backend.
config.API_JWT = axios.post(config.API_URL + '/auth/local', {
	identifier: config.API_LOGIN,
	password: config.API_PASSWORD,
})
.then( response => {
	if(!response.data || !response.data.jwt)
		throw new Error("server didn't return the JWT token");
	return response.data.jwt as string;
})
.catch( err => {
	throw new Error("Error while getting JWT token: " + err.message)
})


export default config as Config;