import log from "./log";

export function logEnvironment() {
    const isProd = import.meta.env.PROD;
    const isDev = import.meta.env.DEV;
    log.d({isDev, isProd}, '{isDev, isProd}')
}