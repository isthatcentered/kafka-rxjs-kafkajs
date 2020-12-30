import casual from "casual"
import { interval } from "rxjs"
import { scan } from "rxjs/operators"

export const ticker = ( delayMs: number ) =>
	interval( delayMs )
		.pipe(
			scan( ( acc, _ ) => acc + 1, 0 ),
		)



export const EXIT_EVENTS = [
	"exit",
	"SIGINT",
	"SIGUSR1",
	"SIGUSR2",
	"uncaughtException",
]

type OrderId = { readonly ORDER_ID: unique symbol } & string

export type Payment = {
	orderId: OrderId
	userId: string
	items: number
	total: number
}

export const orderIdFromString = ( str: string ) => str as OrderId

export const makePayment = ( overrides: Partial<Payment> = {} ): Payment => ({
	orderId: orderIdFromString( casual.uuid ),
	userId:  casual.uuid,
	items:   casual.integer( 1, 11 ),
	total:   casual.integer( 1, 10000 ),
	...overrides,
})
