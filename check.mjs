import { promises as fs } from "fs";
import fetch from "node-fetch";

fs.readFile(process.argv[process.argv.length - 1], "utf-8")
  .then((res) =>
    res
      .trim()
      .split("\n")
      .map((s) => s.split("\t")[0].replace(/\.$/, ""))
      .filter((s) => /\.hiv$/.test(s))
      .reduce((a, s) => (a.indexOf(s) === -1 ? [...a, s] : a), [])
  )
  .then((domains) =>
    Promise.allSettled(
      domains.map((d) =>
        fetch(`http://${d}/`, {
          method: "GET",
          redirect: "manual",
          timeout: 30 * 1000,
        })
          .then((res) => ({
            domain: d,
            status: res.status,
            redirect: res.headers.get("location"),
          }))
          .catch((err) => ({ domain: d, status: 0, code: err.code }))
      )
    )
  )
  .then((res) =>
    res.map(
      ({ value: { domain, status, redirect } }) =>
        `${domain}\t${status === 0 ? "ERROR" : "OK"}\t${redirect}`
    )
  )
  .then((res) => console.log(res.join("\n")));
