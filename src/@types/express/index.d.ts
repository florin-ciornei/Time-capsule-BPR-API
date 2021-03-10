//expand express request to contain also data about user
declare namespace Express {
	export interface Request {
		userId: string; //undefined if the user is not authneticated
	}
}
