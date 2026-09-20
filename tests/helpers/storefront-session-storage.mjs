export function storefrontSessionStorage(session) {
  const values = new Map();
  let initial = session;
  return {
    values,
    getItem(key) {
      return (
        values.get(key) ??
        (key.startsWith("arky_customer_session:") ? initial : null)
      );
    },
    setItem(key, value) {
      if (key.startsWith("arky_customer_session:")) initial = null;
      values.set(key, value);
    },
    removeItem(key) {
      if (key.startsWith("arky_customer_session:")) initial = null;
      values.delete(key);
    },
  };
}
