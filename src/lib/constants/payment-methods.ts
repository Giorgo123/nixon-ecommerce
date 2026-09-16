// Medios de pago a excluir del Checkout Pro de Mercado Pago. Vacío por defecto —
// no cambia el comportamiento actual (Mercado Pago ofrece todo lo que la cuenta
// tenga habilitado). Para excluir un TIPO completo (ej. todo el efectivo), agregá
// su id a EXCLUDED_PAYMENT_TYPES. Para excluir un medio puntual (ej. una tarjeta
// específica), agregá su id a EXCLUDED_PAYMENT_METHODS.
//
// IDs válidos de tipo (payment_type_id de la API de Mercado Pago):
// "credit_card" | "debit_card" | "prepaid_card" | "ticket" (efectivo/Rapipago/Pago Fácil)
// | "bank_transfer" | "atm" | "digital_wallet" | "digital_currency"
//
// IDs de medio puntual (payment_method_id): ej. "visa", "master", "amex", "rapipago",
// "pagofacil", "account_money" — ver listado completo en la respuesta de
// GET /v1/payment_methods de la API de Mercado Pago si hace falta excluir uno puntual.
export const EXCLUDED_PAYMENT_TYPES: string[] = [];
export const EXCLUDED_PAYMENT_METHODS: string[] = [];
