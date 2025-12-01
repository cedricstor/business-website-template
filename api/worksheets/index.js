const { TableClient } = require('@azure/data-tables')
const crypto = require('crypto')

const tableName = process.env.TABLE_NAME || 'worksheets'
const connectionString =
  process.env.TABLE_CONN_STRING ||
  process.env.AZURE_TABLE_CONNECTION_STRING ||
  process.env.STORAGE_CONNECTION_STRING

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

let tableClientPromise = null

const corsHeaders = (origin) => {
  const allowed =
    allowedOrigins.includes('*') || !origin
      ? '*'
      : allowedOrigins.includes(origin)
      ? origin
      : allowedOrigins[0] || '*'

  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  }
}

const getClient = async () => {
  const conn = typeof connectionString === 'string' ? connectionString.trim() : ''
  if (!conn) {
    throw new Error('Missing TABLE_CONN_STRING / AZURE_TABLE_CONNECTION_STRING')
  }
  if (!tableClientPromise) {
    try {
      const client = TableClient.fromConnectionString(conn, tableName)
      tableClientPromise = client
        .createTable()
        .catch((err) => {
          if (err?.statusCode === 409) return
          throw err
        })
        .then(() => client)
    } catch (err) {
      throw new Error('Invalid table connection string.')
    }
  }
  return tableClientPromise
}

const makeEmbedUrl = (url = '') => {
  if (!url) return ''
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}action=edit&wdAllowInteractivity=True&wdDownloadButton=True`
}

const makeId = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString('hex')

const mapEntityToSheet = (entity) => ({
  id: entity.rowKey,
  title: entity.title || '',
  url: entity.url || '',
  embed: entity.embed || makeEmbedUrl(entity.url || ''),
  folder: entity.folder || '',
  createdAt: entity.createdAt || '',
})

module.exports = async function (context, req) {
  const method = (req.method || 'GET').toUpperCase()
  const origin = req.headers?.origin
  const headers = corsHeaders(origin)

  if (method === 'OPTIONS') {
    context.res = { status: 200, headers }
    return
  }

  if (!connectionString) {
    context.res = {
      status: 500,
      headers,
      body: { error: 'Server missing table connection settings.' },
    }
    return
  }

  try {
    const client = await getClient()

    if (method === 'GET') {
      const sheets = []
      const folders = []

      for await (const entity of client.listEntities({
        queryOptions: { filter: `PartitionKey eq 'sheet'` },
      })) {
        sheets.push(mapEntityToSheet(entity))
      }

      for await (const entity of client.listEntities({
        queryOptions: { filter: `PartitionKey eq 'folder'` },
      })) {
        folders.push(entity.rowKey)
      }

      context.res = {
        status: 200,
        headers,
        body: { sheets, folders },
      }
      return
    }

    if (method === 'POST') {
      const body = req.body || {}
      const isFolder = body.type === 'folder' || body.folderOnly

      if (isFolder) {
        const name = (body.name || body.folder || '').trim()
        if (!name) {
          context.res = { status: 400, headers, body: { error: 'Folder name is required.' } }
          return
        }
        await client.upsertEntity({
          partitionKey: 'folder',
          rowKey: name,
          createdAt: new Date().toISOString(),
        })
        context.res = { status: 200, headers, body: { folder: name } }
        return
      }

      const title = (body.title || '').trim()
      const url = (body.url || '').trim()
      const folder = (body.folder || '').trim()
      if (!title || !url) {
        context.res = { status: 400, headers, body: { error: 'Title and URL are required.' } }
        return
      }
      const id = body.id || makeId()
      const embed = body.embed || makeEmbedUrl(url)

      await client.upsertEntity({
        partitionKey: 'sheet',
        rowKey: id,
        title,
        url,
        folder,
        embed,
        createdAt: new Date().toISOString(),
      })

      context.res = {
        status: 200,
        headers,
        body: { sheet: { id, title, url, folder, embed } },
      }
      return
    }

    if (method === 'DELETE') {
      const id = context.bindingData?.id || req.query?.id
      const type = req.query?.type || 'sheet'
      const partitionKey = type === 'folder' ? 'folder' : 'sheet'

      if (!id) {
        context.res = { status: 400, headers, body: { error: 'Missing id to delete.' } }
        return
      }

      await client.deleteEntity(partitionKey, id)
      context.res = { status: 200, headers, body: { ok: true } }
      return
    }

    context.res = { status: 405, headers, body: { error: 'Method not allowed' } }
  } catch (err) {
    context.log.error('worksheets error', err)
    context.res = {
      status: 500,
      headers,
      body: { error: 'Server error', detail: err.message },
    }
  }
}
