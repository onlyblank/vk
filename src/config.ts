import * as dotenv from 'dotenv';
dotenv.config();

const variableNames = [
	'ACCESS_TOKEN', 
	'SECRET_TOKEN', 
	'CONFIRMATION_TOKEN',
	'API_VERSION',
	'PORT',
	'GROUP_ID',
	'USER_TOKEN',
	'API_URL'
] as const;

type Config = Record<typeof variableNames[number], string>;

const config: Partial<Config> = {};
for(const key of variableNames)
	config[key] = process.env[key];
	

const missingValueEntries = Object.entries(config).filter(pair => pair[1] === undefined);
if(missingValueEntries.length != 0){
	const keys = missingValueEntries.map(pair => pair[0]);
	throw new TypeError("Some environment variables are undefined: " 
		+ keys.join(',') 
		+ ". Define them in .env file.");
}

export default config as Config;