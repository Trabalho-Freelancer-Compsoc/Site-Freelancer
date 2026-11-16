// Formato de um id do banco (uuid). Os controllers conferem antes de consultar,
// para responder 400 (pedido errado) em vez de 500 (erro do servidor)
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
