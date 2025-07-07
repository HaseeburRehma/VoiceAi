export const runtime = 'node'

import { defineEventHandler } from 'h3'
// Nuxt will auto-import useRuntimeConfig, so you don't need to pull it from 'h3'

import Twilio from 'twilio'

export default defineEventHandler(async (event) => {
  // this comes from your nuxt.config runtimeConfig
  const cfg = useRuntimeConfig().twilio  
  const identity = `user-${Math.random().toString(36).substring(2, 8)}`

  const AccessToken = Twilio.jwt.AccessToken
  const VoiceGrant   = AccessToken.VoiceGrant

  const token = new AccessToken(
    cfg.accountSid,
    cfg.apiKeySid,
    cfg.apiKeySecret,
    { identity }
  )

  token.addGrant(new VoiceGrant({
    outgoingApplicationSid: cfg.twimlAppSid,
    incomingAllow: true,
  }))

  return { token: token.toJwt(), identity }
})
