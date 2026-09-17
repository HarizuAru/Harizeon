// Dev helper (not committed): list findings for one login (env EMAIL).
const API = process.env.API_BASE ?? "http://harizeon-api-live:8080";

const run = async () => {
  let res = await fetch(API + "/v1/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: process.env.EMAIL, password: "correct-horse-battery-99" }),
  });
  if (!res.ok) throw new Error("login failed " + res.status);
  const cookie = res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  res = await fetch(API + "/v1/findings", { headers: { cookie } });
  const d = await res.json();
  for (const f of d.data.slice(0, 12)) console.log(f.severity.padEnd(9), f.category === "tls" ? "[tls] " : "[hdr] ", f.title);
  console.log("total:", d.data.length);
};

run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
