import Task from "./Task";

export default interface Post {
	id: number
	post_id: number
	task: Task
	created_at: string
	updated_at?: string
	published_at?: string
	answered: boolean | null
}
