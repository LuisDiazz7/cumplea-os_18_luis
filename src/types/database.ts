export interface Guardia {
  id: number
  auth_id: string
  nombre: string
  rol: string
  fecha_creacion: string
}

export interface Invitado {
  id: number
  nombre: string
  foto: string | null
  codigo_qr: string
  fecha_creacion: string
}

export interface Entrada {
  id: number
  invitado_id: number
  guardia_id: number
  hora_entrada: string
  regalo: string | null
}

export interface InvitadoConEntrada {
  invitado: Invitado
  entrada: Entrada | null
  guardia: Guardia | null
}