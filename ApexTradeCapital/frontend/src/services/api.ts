export async function api(path, options={}) {
  const url = `${import.meta.env.VITE_API_URL}${path}`;
  const res = await fetch(url, { headers:{ "Content-Type":"application/json" }, ...options });
  return res.json();
}

