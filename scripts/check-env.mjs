import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

function parseEnv(path) {
  const env = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue
    env[trimmed.slice(0, index)] = trimmed.slice(index + 1)
  }
  return env
}

function report(name, pass, detail = '') {
  const status = pass ? '[OK]  ' : '[FAIL]'
  console.log(`${status} ${name}${detail ? ` – ${detail}` : ''}`)
  return pass
}

const env = parseEnv('.env')
const placeholders = ['your-anon-key', 'your-service-role-key', 'your-project.supabase.co']
let passed = 0
let total = 0

function check(name, ok, detail) {
  total += 1
  if (report(name, ok, detail)) passed += 1
}

for (const key of [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
]) {
  const value = env[key]
  const missing = !value
  const isPlaceholder = value && placeholders.some((placeholder) => value.includes(placeholder))
  check(`${key} set`, !missing && !isPlaceholder, missing ? 'missing' : isPlaceholder ? 'placeholder' : 'OK')
}

check(
  'URL match',
  env.SUPABASE_URL === env.VITE_SUPABASE_URL,
  env.SUPABASE_URL === env.VITE_SUPABASE_URL ? 'SUPABASE_URL = VITE_SUPABASE_URL' : 'different URLs'
)

const url = env.VITE_SUPABASE_URL
const anonKey = env.VITE_SUPABASE_ANON_KEY
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (url && anonKey && !anonKey.includes('your-anon')) {
  const anonClient = createClient(url, anonKey)
  const { error } = await anonClient.from('categories').select('id').limit(1)
  check('Anon key (API access)', !error, error ? error.message : 'categories accessible')
} else {
  check('Anon key (API access)', false, 'invalid key')
}

if (url && serviceKey && !serviceKey.includes('your-service')) {
  const adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error } = await adminClient.from('profiles').select('id').limit(1)
  check('Service role key (API access)', !error, error ? error.message : 'profiles accessible')
} else {
  check('Service role key (API access)', false, 'invalid key')
}

if (url && anonKey) {
  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await authClient.auth.signInWithPassword({
    email: 'demo@skillswap.bg',
    password: 'demo123',
  })
  check('Demo login', !error && !!data.session, error ? error.message : 'demo@skillswap.bg')
}

console.log('')
console.log(passed === total ? 'All checks passed.' : `${total - passed} check(s) failed.`)

process.exit(passed === total ? 0 : 1)
