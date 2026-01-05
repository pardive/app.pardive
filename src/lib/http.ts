export function authHeader(token?: string) {
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`, // NOTHING ELSE
  };
}
