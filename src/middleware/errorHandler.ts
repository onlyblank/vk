export const errorHandler = async (_context, next) => {
	try {
		await next();
	}
	catch(error){
		console.error("Error: " + error.message);
	}
}