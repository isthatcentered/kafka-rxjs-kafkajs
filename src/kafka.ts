import { Admin, Consumer, Kafka, KafkaConfig } from "kafkajs"
import { Subject } from "rxjs"




export const init = async ( config: KafkaConfig ) => {
	const consumers: Consumer[] = []
	const kafka = new Kafka( { ...config, logLevel: 2 } )
	const admin = kafka.admin()
	const producer = kafka.producer( { allowAutoTopicCreation: false } )
	
	await producer.connect()
	await admin.connect()
	
	return {
		createTopics: createTopics( admin ),
		consume:      async <T>( topic: string, mapvalue: ( value: string ) => T ) => {
			const [ subject, consumer ] = await subscribe( kafka )( topic, mapvalue )
			consumers.push( consumer )
			return subject
		},
		send:         async ( topic: string, message: { key?: string , value: string } ) => {
			await producer.send( {
				topic,
				messages: [
					message,
				],
			} )
		},
		close:        async () => {
			await admin.disconnect()
			await Promise.all( consumers.map( c => c.disconnect() ) )
		},
	}
}

const createTopics = ( admin: Admin ) => ( topics: string[] ) =>
	admin.createTopics( { topics: topics.map( topic => ({ topic }) ) } )

const subscribe = ( kafka: Kafka ) => async <T>( topic: string, mapvalue: ( value: string ) => T ): Promise<[ Subject<{ key: string | null, value: T }>, Consumer ]> => {
	const subject = new Subject<{ key: string | null, value: T }>()
	const consumer = kafka.consumer( { groupId: Math.random().toString() } )
	await consumer.connect()
	await consumer.subscribe( { topic } )
	await consumer.run( {
		eachMessage: async ( { message } ) => {
			subject.next( {
				key:   message.key?.toString(),
				value: mapvalue( message.value!.toString() ),
			} )
		},
	} )
	
	return [ subject, consumer ]
}

