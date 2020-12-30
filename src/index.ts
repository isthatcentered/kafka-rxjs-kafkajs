import casual from "casual"
import blessed from "blessed"
import { delay, map, scan, switchMap, take, tap } from "rxjs/operators"
import * as K from "./kafka"
import { from, merge, Observable } from "rxjs"
import { EXIT_EVENTS, makePayment, orderIdFromString, Payment, ticker } from "./random"




const TOPICS = {
	PAYMENTS:         "payments",
	VALID_PAYMENTS:   "valid-payments",
	INVALID_PAYMENTS: "invalid-payments",
}

const main = async () => {
	const screen = blessed.screen()
	
	const store = await K.init( {
		clientId: "my-app",
		brokers:  [ "localhost:29092" ],
	} )
	
	await store.createTopics( Object.values( TOPICS ) )
	
	// Events
	const payments$ = await store.consume<Payment>( TOPICS.PAYMENTS, JSON.parse )
	const validPayments$ = await store.consume( TOPICS.VALID_PAYMENTS, orderIdFromString )
	const invalidPayments$ = await store.consume( TOPICS.INVALID_PAYMENTS, orderIdFromString )
	
	// Reactions
	const emitPayments$ = ticker( 1000 )
		.pipe(
			take( 10 ),
			switchMap( index =>
				from(
					store.send(
						TOPICS.PAYMENTS,
						{
							value: JSON.stringify(
								makePayment( {
									orderId: orderIdFromString( `trs_${index}` ),
								} ),
							),
						},
					),
				),
			),
		)
	
	const processPayments$ = payments$
		.pipe(
			delay( 2500 ),
			switchMap( event =>
				from(
					store.send(
						casual.boolean ?// Pretend some validation happened
						TOPICS.VALID_PAYMENTS :
						TOPICS.INVALID_PAYMENTS,
						{ value: event.value.orderId! },
					),
				),
			),
		)
	
	const paymentsProcessResults$ = merge(
		payments$.pipe( map( event => ({ type: "PAYMENT" as const, value: event.value }) ) ),
		validPayments$.pipe( map( event => ({ type: "VALID" as const, orderId: event.value }) ) ),
		invalidPayments$.pipe( map( event => ({ type: "INVALID" as const, orderId: event.value }) ) ),
	).pipe(
		scan( ( acc, curr ) => {
			switch ( curr.type ) {
				case "PAYMENT":
					return {
						...acc,
						[ curr.value.orderId ]: {
							...curr.value,
							status: "PENDING" as const,
						},
					}
				
				case "INVALID":
				case "VALID":
					return {
						...acc,
						[ curr.orderId ]: {
							...acc[ curr.orderId ]!,
							status: curr.type,
						},
					}
			}
		}, {} as Record<string, Payment & { status: "VALID" | "INVALID" | "PENDING" }> ),
	)
	
	const render$ = paymentsProcessResults$.pipe(
		map( orders => {
			return [
				[ "orderId", "total", "status" ],
				...Object.keys( orders ).map( key => {
					const order = orders[ key ]!
					return [ key, order.total.toString(), order.status ]
				} ),
			]
		} ),
		tap( rows => {
			const table = blessed.table( { border: "line" } )
			table.setData( rows )
			screen.append( table )
			screen.render()
		} ),
	)
	
	const subs = [ emitPayments$, processPayments$, render$ ].map( o => (o as Observable<any>).subscribe() )
	
	EXIT_EVENTS.forEach( event =>
		process.on( event, async () => {
			await store.close()
			subs.forEach( sub => sub.unsubscribe() )
		} ),
	)
}

main()

