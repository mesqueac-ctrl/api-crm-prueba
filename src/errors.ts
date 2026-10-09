// Error con código HTTP; el middleware de errores lo convierte en respuesta JSON.
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
