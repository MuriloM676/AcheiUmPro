import nodemailer from 'nodemailer'
import webpush from 'web-push'
import twilio from 'twilio'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

export type NotificationChannel = 'webpush' | 'email' | 'sms' | 'in_app'

interface TriggerOptions {
  userId: number
  title: string
  body: string
  channels?: NotificationChannel[]
  metadata?: Record<string, unknown>
}

interface WebPushSubscription {
  endpoint: string
  keys: {
    auth: string
    p256dh: string
  }
}

const smtpHost = process.env.SMTP_HOST
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS

const twilioSid = process.env.TWILIO_ACCOUNT_SID
const twilioToken = process.env.TWILIO_AUTH_TOKEN
const twilioFrom = process.env.TWILIO_FROM_NUMBER

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:suporte@acheiumpro.com'

let mailTransporter: nodemailer.Transporter | null = null
let twilioClient: ReturnType<typeof twilio>| null = null
let webPushConfigured = false

function getTransporter() {
  if (!smtpHost || !smtpUser || !smtpPass) {
    return null
  }

  if (!mailTransporter) {
    mailTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort || 587,
      secure: Boolean(process.env.SMTP_SECURE === 'true'),
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    })
  }

  return mailTransporter
}

function getTwilioClient() {
  if (!twilioSid || !twilioToken || !twilioFrom) {
    return null
  }

  if (!twilioClient) {
    twilioClient = twilio(twilioSid, twilioToken)
  }

  return twilioClient
}

function configureWebPush() {
  if (webPushConfigured) {
    return
  }

  if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
    webPushConfigured = true
  }
}

async function insertNotification(userId: number, channel: NotificationChannel, title: string, body: string, metadata?: Record<string, unknown>) {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, channel, title, body, metadata) VALUES (?, ?, ?, ?, JSON_OBJECT())',
      [userId, channel, title, body]
    )

    if (metadata && Object.keys(metadata).length > 0) {
      await pool.query(
        'UPDATE notifications SET metadata = JSON_MERGE_PATCH(IFNULL(metadata, JSON_OBJECT()), CAST(? AS JSON)) WHERE user_id = ? AND channel = ? AND title = ? ORDER BY id DESC LIMIT 1',
        [JSON.stringify(metadata), userId, channel, title]
      )
    }
  } catch (err: any) {
    // If notifications table doesn't exist, skip silently to avoid crashing the app
    if (err && err.code === 'ER_NO_SUCH_TABLE') {
      console.warn('Notifications table missing; skipping insertNotification')
      return
    }
    throw err
  }
}

async function notifyEmail(userId: number, title: string, body: string) {
  const transporter = getTransporter()
  if (!transporter) return

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT email FROM users WHERE id = ? LIMIT 1',
    [userId]
  )

  if (!rows.length) return

  await transporter.sendMail({
    from: smtpUser,
    to: rows[0].email,
    subject: title,
    text: body
  })
}

async function notifySms(userId: number, body: string) {
  const client = getTwilioClient()
  if (!client) return

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT phone FROM users WHERE id = ? LIMIT 1',
    [userId]
  )
  if (!rows.length || !rows[0].phone) return

  await client.messages.create({
    body,
    to: rows[0].phone,
    from: twilioFrom!
  })
}

async function notifyWebPush(userId: number, payload: { title: string; body: string }) {
  configureWebPush()
  if (!webPushConfigured) return

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT endpoint, p256dh, auth FROM notification_subscriptions WHERE user_id = ?',
    [userId]
  )

  if (!rows.length) return

  const notificationPayload = JSON.stringify({ title: payload.title, body: payload.body })

  await Promise.all(
    rows.map(async (row) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth }
          },
          notificationPayload
        )
      } catch (error) {
        console.error('Falha ao enviar WebPush:', error)
      }
    })
  )
}

export async function triggerNotification(options: TriggerOptions) {
  const channels: NotificationChannel[] = options.channels && options.channels.length
    ? options.channels
    : ['in_app']

  await Promise.all(
    channels.map(async (channel) => {
      try {
        await insertNotification(options.userId, channel, options.title, options.body, options.metadata)
      } catch (err) {
        console.error('Failed to insert notification (non-fatal):', err)
      }

      try {
        if (channel === 'email') {
          await notifyEmail(options.userId, options.title, options.body)
        }
        if (channel === 'sms') {
          await notifySms(options.userId, options.body)
        }
        if (channel === 'webpush') {
          await notifyWebPush(options.userId, { title: options.title, body: options.body })
        }
      } catch (error) {
        console.error('Erro ao despachar notificação:', error)
      }
    })
  )
}

export async function registerWebPushSubscription(userId: number, subscription: WebPushSubscription) {
  try {
    await pool.query(
      `INSERT INTO notification_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE p256dh = VALUES(p256dh), auth = VALUES(auth)` ,
      [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
    )
  } catch (err: any) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') {
      console.warn('notification_subscriptions table missing; skipping registerWebPushSubscription')
      return
    }
    throw err
  }
}
