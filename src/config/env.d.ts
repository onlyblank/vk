import { Config } from './configTypes';

declare global {
	namespace NodeJS {
		// eslint-disable-next-line @typescript-eslint/no-empty-interface
		interface ProcessEnv extends Config {}
	}
}
  
export {};