// Centralised API fetch wrapper
export async function api(url, opts = {}) {
  const isFormData = opts.body instanceof FormData;
  const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
  
  if (opts.headers) Object.assign(headers, opts.headers);

  const res = await fetch(url, {
    credentials: 'include',          // send session cookie always
    ...opts,
    headers,
    body: isFormData ? opts.body : (opts.body ? JSON.stringify(opts.body) : undefined),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Something went wrong')
  return data
}
