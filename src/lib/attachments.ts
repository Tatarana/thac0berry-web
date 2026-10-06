import { supabase } from './supabase'

// Binários no Storage (bucket privado `attachments`, caminho <uid>/<sha256>)
// com um registro em `attachment`. O mesmo arquivo nunca sobe duas vezes.

/** Envia o binário (se ainda não estiver lá) e devolve o id do attachment. */
export async function uploadAttachment(userID: string, bytes: Uint8Array, mime: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>)
  const sha256 = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')

  const known = await supabase.from('attachment').select('id').eq('sha256', sha256).maybeSingle()
  if (known.error) throw new Error(`attachment: ${known.error.message}`)
  if (known.data) return (known.data as { id: string }).id

  const path = `${userID}/${sha256}`
  const upload = await supabase.storage.from('attachments').upload(path, new Blob([bytes as Uint8Array<ArrayBuffer>], { type: mime }), {
    contentType: mime,
    upsert: false,
  })
  // Arquivo já no bucket (envio anterior interrompido antes do registro): segue.
  if (upload.error && !/exists|duplicate/i.test(upload.error.message)) {
    throw new Error(`file upload: ${upload.error.message}`)
  }
  const id = crypto.randomUUID()
  const { error } = await supabase.from('attachment').insert({ id, sha256, mime, bytes: bytes.length, storage_path: path })
  if (error) throw new Error(`attachment: ${error.message}`)
  return id
}

/** Link temporário (1 h) de um anexo; o bucket é privado. */
export async function attachmentURL(attachmentID: string): Promise<string | null> {
  const { data } = await supabase.from('attachment').select('storage_path').eq('id', attachmentID).maybeSingle()
  const path = (data as { storage_path: string } | null)?.storage_path
  if (!path) return null
  const signed = await supabase.storage.from('attachments').createSignedUrl(path, 3600)
  return signed.data?.signedUrl ?? null
}

/**
 * resizedForSketch + jpegData(0.82) do iPad: a imagem escolhida vira JPEG
 * com no máximo 800 px no lado maior.
 */
export async function portraitJPEG(file: Blob, maxDimension = 800): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('this browser cannot resize images')
  // Fundo branco: PNG com transparência não fica preto no JPEG.
  context.fillStyle = '#fff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
  if (!blob) throw new Error('could not encode the image')
  return new Uint8Array(await blob.arrayBuffer())
}
