const variables = [
	'ACCESS_TOKEN', 
	'SECRET_TOKEN', 
	'CONFIRMATION_TOKEN',
	'API_VERSION',
	'PORT',
	'GROUP_ID',
	'USER_TOKEN',
	'API_URL',
	'API_LOGIN',
	'API_PASSWORD'
] as const;

type Env = Record<typeof variables[number], string>;
type Config = Env & { API_JWT : Promise<string> };

export { variables, Config, Env };