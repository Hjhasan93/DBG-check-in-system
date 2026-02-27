export function getAdminToken() {
  return sessionStorage.getItem("dbg_admin_token") || "";
}

export async function adminFetch(url, options = {}) {
  const token = getAdminToken();

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  return fetch(url, { ...options, headers });
}
