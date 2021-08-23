export default interface Task {
	id: number
	question: string
	code: string | null
	annotation: string | null
	enabled: boolean
	answer: string
	author: any
	published_at?: string
	created_at: string
	updated_at?: string
}
