import { h as decodeKey } from './chunks/astro/server_BvvS3v0v.mjs';
import './chunks/shared_BTASe_bZ.mjs';

/**
 * Tokenize input string.
 */
function lexer(str) {
    var tokens = [];
    var i = 0;
    while (i < str.length) {
        var char = str[i];
        if (char === "*" || char === "+" || char === "?") {
            tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
            continue;
        }
        if (char === "\\") {
            tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
            continue;
        }
        if (char === "{") {
            tokens.push({ type: "OPEN", index: i, value: str[i++] });
            continue;
        }
        if (char === "}") {
            tokens.push({ type: "CLOSE", index: i, value: str[i++] });
            continue;
        }
        if (char === ":") {
            var name = "";
            var j = i + 1;
            while (j < str.length) {
                var code = str.charCodeAt(j);
                if (
                // `0-9`
                (code >= 48 && code <= 57) ||
                    // `A-Z`
                    (code >= 65 && code <= 90) ||
                    // `a-z`
                    (code >= 97 && code <= 122) ||
                    // `_`
                    code === 95) {
                    name += str[j++];
                    continue;
                }
                break;
            }
            if (!name)
                throw new TypeError("Missing parameter name at ".concat(i));
            tokens.push({ type: "NAME", index: i, value: name });
            i = j;
            continue;
        }
        if (char === "(") {
            var count = 1;
            var pattern = "";
            var j = i + 1;
            if (str[j] === "?") {
                throw new TypeError("Pattern cannot start with \"?\" at ".concat(j));
            }
            while (j < str.length) {
                if (str[j] === "\\") {
                    pattern += str[j++] + str[j++];
                    continue;
                }
                if (str[j] === ")") {
                    count--;
                    if (count === 0) {
                        j++;
                        break;
                    }
                }
                else if (str[j] === "(") {
                    count++;
                    if (str[j + 1] !== "?") {
                        throw new TypeError("Capturing groups are not allowed at ".concat(j));
                    }
                }
                pattern += str[j++];
            }
            if (count)
                throw new TypeError("Unbalanced pattern at ".concat(i));
            if (!pattern)
                throw new TypeError("Missing pattern at ".concat(i));
            tokens.push({ type: "PATTERN", index: i, value: pattern });
            i = j;
            continue;
        }
        tokens.push({ type: "CHAR", index: i, value: str[i++] });
    }
    tokens.push({ type: "END", index: i, value: "" });
    return tokens;
}
/**
 * Parse a string for the raw tokens.
 */
function parse(str, options) {
    if (options === void 0) { options = {}; }
    var tokens = lexer(str);
    var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a;
    var defaultPattern = "[^".concat(escapeString(options.delimiter || "/#?"), "]+?");
    var result = [];
    var key = 0;
    var i = 0;
    var path = "";
    var tryConsume = function (type) {
        if (i < tokens.length && tokens[i].type === type)
            return tokens[i++].value;
    };
    var mustConsume = function (type) {
        var value = tryConsume(type);
        if (value !== undefined)
            return value;
        var _a = tokens[i], nextType = _a.type, index = _a.index;
        throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
    };
    var consumeText = function () {
        var result = "";
        var value;
        while ((value = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR"))) {
            result += value;
        }
        return result;
    };
    while (i < tokens.length) {
        var char = tryConsume("CHAR");
        var name = tryConsume("NAME");
        var pattern = tryConsume("PATTERN");
        if (name || pattern) {
            var prefix = char || "";
            if (prefixes.indexOf(prefix) === -1) {
                path += prefix;
                prefix = "";
            }
            if (path) {
                result.push(path);
                path = "";
            }
            result.push({
                name: name || key++,
                prefix: prefix,
                suffix: "",
                pattern: pattern || defaultPattern,
                modifier: tryConsume("MODIFIER") || "",
            });
            continue;
        }
        var value = char || tryConsume("ESCAPED_CHAR");
        if (value) {
            path += value;
            continue;
        }
        if (path) {
            result.push(path);
            path = "";
        }
        var open = tryConsume("OPEN");
        if (open) {
            var prefix = consumeText();
            var name_1 = tryConsume("NAME") || "";
            var pattern_1 = tryConsume("PATTERN") || "";
            var suffix = consumeText();
            mustConsume("CLOSE");
            result.push({
                name: name_1 || (pattern_1 ? key++ : ""),
                pattern: name_1 && !pattern_1 ? defaultPattern : pattern_1,
                prefix: prefix,
                suffix: suffix,
                modifier: tryConsume("MODIFIER") || "",
            });
            continue;
        }
        mustConsume("END");
    }
    return result;
}
/**
 * Compile a string to a template function for the path.
 */
function compile(str, options) {
    return tokensToFunction(parse(str, options), options);
}
/**
 * Expose a method for transforming tokens into the path function.
 */
function tokensToFunction(tokens, options) {
    if (options === void 0) { options = {}; }
    var reFlags = flags(options);
    var _a = options.encode, encode = _a === void 0 ? function (x) { return x; } : _a, _b = options.validate, validate = _b === void 0 ? true : _b;
    // Compile all the tokens into regexps.
    var matches = tokens.map(function (token) {
        if (typeof token === "object") {
            return new RegExp("^(?:".concat(token.pattern, ")$"), reFlags);
        }
    });
    return function (data) {
        var path = "";
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (typeof token === "string") {
                path += token;
                continue;
            }
            var value = data ? data[token.name] : undefined;
            var optional = token.modifier === "?" || token.modifier === "*";
            var repeat = token.modifier === "*" || token.modifier === "+";
            if (Array.isArray(value)) {
                if (!repeat) {
                    throw new TypeError("Expected \"".concat(token.name, "\" to not repeat, but got an array"));
                }
                if (value.length === 0) {
                    if (optional)
                        continue;
                    throw new TypeError("Expected \"".concat(token.name, "\" to not be empty"));
                }
                for (var j = 0; j < value.length; j++) {
                    var segment = encode(value[j], token);
                    if (validate && !matches[i].test(segment)) {
                        throw new TypeError("Expected all \"".concat(token.name, "\" to match \"").concat(token.pattern, "\", but got \"").concat(segment, "\""));
                    }
                    path += token.prefix + segment + token.suffix;
                }
                continue;
            }
            if (typeof value === "string" || typeof value === "number") {
                var segment = encode(String(value), token);
                if (validate && !matches[i].test(segment)) {
                    throw new TypeError("Expected \"".concat(token.name, "\" to match \"").concat(token.pattern, "\", but got \"").concat(segment, "\""));
                }
                path += token.prefix + segment + token.suffix;
                continue;
            }
            if (optional)
                continue;
            var typeOfMessage = repeat ? "an array" : "a string";
            throw new TypeError("Expected \"".concat(token.name, "\" to be ").concat(typeOfMessage));
        }
        return path;
    };
}
/**
 * Escape a regular expression string.
 */
function escapeString(str) {
    return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
/**
 * Get the flags for a regexp from the options.
 */
function flags(options) {
    return options && options.sensitive ? "" : "i";
}

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getRouteGenerator(segments, addTrailingSlash) {
  const template = segments.map((segment) => {
    return "/" + segment.map((part) => {
      if (part.spread) {
        return `:${part.content.slice(3)}(.*)?`;
      } else if (part.dynamic) {
        return `:${part.content}`;
      } else {
        return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
    }).join("");
  }).join("");
  let trailing = "";
  if (addTrailingSlash === "always" && segments.length) {
    trailing = "/";
  }
  const toPath = compile(template + trailing);
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    const path = toPath(sanitizedParams);
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware(_, next) {
      return next();
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///home/steven/work/ai-toolbox/","adapterName":"@astrojs/netlify","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/.pnpm/astro@4.14.3_@types+node@22.4.1_rollup@4.21.0_typescript@5.5.4/node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/about.Cv_qDB7B.css"}],"routeData":{"route":"/404","isIndex":false,"type":"page","pattern":"^\\/404\\/?$","segments":[[{"content":"404","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/404.astro","pathname":"/404","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"inline","value":"const t=document.getElementById(\"logout\");t&&t.addEventListener(\"click\",()=>{fetch(\"/api/logout\",{method:\"POST\"}).then(o=>{if(!o.ok)throw new Error(\"Not OK!\");window.location.href=\"/\"}).catch(o=>{console.warn(\"Fetch logout failed\"),console.error(o)})});\n"}],"styles":[{"type":"external","src":"/_astro/about.Cv_qDB7B.css"},{"type":"external","src":"/_astro/about.CTWSK3Fg.css"}],"routeData":{"route":"/about","isIndex":false,"type":"page","pattern":"^\\/about\\/?$","segments":[[{"content":"about","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/about.astro","pathname":"/about","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/categories.json","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/categories\\.json\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"categories.json","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/categories.json.ts","pathname":"/api/categories.json","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/headlines.json","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/headlines\\.json\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"headlines.json","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/headlines.json.ts","pathname":"/api/headlines.json","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/instructions.json","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/instructions\\.json\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"instructions.json","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/instructions.json.ts","pathname":"/api/instructions.json","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/knowledge-base.json","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/knowledge-base\\.json\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"knowledge-base.json","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/knowledge-base.json.ts","pathname":"/api/knowledge-base.json","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/login","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/login\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"login","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/login.ts","pathname":"/api/login","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/logout","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/logout\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"logout","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/logout.ts","pathname":"/api/logout","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/promptexecution.json","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/promptExecution\\.json\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"promptExecution.json","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/promptExecution.json.ts","pathname":"/api/promptExecution.json","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/prompts.json","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/prompts\\.json\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"prompts.json","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/prompts.json.ts","pathname":"/api/prompts.json","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"inline","value":"const t=document.getElementById(\"logout\");t&&t.addEventListener(\"click\",()=>{fetch(\"/api/logout\",{method:\"POST\"}).then(o=>{if(!o.ok)throw new Error(\"Not OK!\");window.location.href=\"/\"}).catch(o=>{console.warn(\"Fetch logout failed\"),console.error(o)})});\n"}],"styles":[{"type":"external","src":"/_astro/about.Cv_qDB7B.css"},{"type":"external","src":"/_astro/about.CTWSK3Fg.css"}],"routeData":{"route":"/headlines/demo","isIndex":false,"type":"page","pattern":"^\\/headlines\\/demo\\/?$","segments":[[{"content":"headlines","dynamic":false,"spread":false}],[{"content":"demo","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/headlines/demo.astro","pathname":"/headlines/demo","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"inline","value":"const t=document.getElementById(\"logout\");t&&t.addEventListener(\"click\",()=>{fetch(\"/api/logout\",{method:\"POST\"}).then(o=>{if(!o.ok)throw new Error(\"Not OK!\");window.location.href=\"/\"}).catch(o=>{console.warn(\"Fetch logout failed\"),console.error(o)})});\n"}],"styles":[{"type":"external","src":"/_astro/about.Cv_qDB7B.css"},{"type":"external","src":"/_astro/about.CTWSK3Fg.css"}],"routeData":{"route":"/headlines","isIndex":true,"type":"page","pattern":"^\\/headlines\\/?$","segments":[[{"content":"headlines","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/headlines/index.astro","pathname":"/headlines","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"inline","value":"const o=document.getElementById(\"form-error\");document.forms[0].addEventListener(\"submit\",t=>{t.preventDefault();const e=t.target;r(e)});async function r(t){try{const e=await fetch(\"/api/login\",{method:t.method,body:new FormData(t)});e.ok?window.location.href=\"/\":o.innerText=\"• \"+(await e.json()).message}catch(e){console.error(\"Fetch login error:\"+e)}}\n"}],"styles":[{"type":"external","src":"/_astro/about.Cv_qDB7B.css"}],"routeData":{"route":"/login","isIndex":true,"type":"page","pattern":"^\\/login\\/?$","segments":[[{"content":"login","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/login/index.astro","pathname":"/login","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"inline","value":"const t=document.getElementById(\"logout\");t&&t.addEventListener(\"click\",()=>{fetch(\"/api/logout\",{method:\"POST\"}).then(o=>{if(!o.ok)throw new Error(\"Not OK!\");window.location.href=\"/\"}).catch(o=>{console.warn(\"Fetch logout failed\"),console.error(o)})});\n"}],"styles":[{"type":"external","src":"/_astro/about.Cv_qDB7B.css"},{"type":"external","src":"/_astro/about.CTWSK3Fg.css"}],"routeData":{"route":"/prompt-library/categories/add","isIndex":false,"type":"page","pattern":"^\\/prompt-library\\/categories\\/add\\/?$","segments":[[{"content":"prompt-library","dynamic":false,"spread":false}],[{"content":"categories","dynamic":false,"spread":false}],[{"content":"add","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/prompt-library/categories/add.astro","pathname":"/prompt-library/categories/add","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"inline","value":"const t=document.getElementById(\"logout\");t&&t.addEventListener(\"click\",()=>{fetch(\"/api/logout\",{method:\"POST\"}).then(o=>{if(!o.ok)throw new Error(\"Not OK!\");window.location.href=\"/\"}).catch(o=>{console.warn(\"Fetch logout failed\"),console.error(o)})});\n"}],"styles":[{"type":"external","src":"/_astro/about.Cv_qDB7B.css"},{"type":"external","src":"/_astro/about.CTWSK3Fg.css"}],"routeData":{"route":"/prompt-library/categories/[id]","isIndex":false,"type":"page","pattern":"^\\/prompt-library\\/categories\\/([^/]+?)\\/?$","segments":[[{"content":"prompt-library","dynamic":false,"spread":false}],[{"content":"categories","dynamic":false,"spread":false}],[{"content":"id","dynamic":true,"spread":false}]],"params":["id"],"component":"src/pages/prompt-library/categories/[id].astro","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"inline","value":"const t=document.getElementById(\"logout\");t&&t.addEventListener(\"click\",()=>{fetch(\"/api/logout\",{method:\"POST\"}).then(o=>{if(!o.ok)throw new Error(\"Not OK!\");window.location.href=\"/\"}).catch(o=>{console.warn(\"Fetch logout failed\"),console.error(o)})});\n"}],"styles":[{"type":"external","src":"/_astro/about.Cv_qDB7B.css"},{"type":"external","src":"/_astro/about.CTWSK3Fg.css"}],"routeData":{"route":"/prompt-library/categories","isIndex":true,"type":"page","pattern":"^\\/prompt-library\\/categories\\/?$","segments":[[{"content":"prompt-library","dynamic":false,"spread":false}],[{"content":"categories","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/prompt-library/categories/index.astro","pathname":"/prompt-library/categories","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"inline","value":"const t=document.getElementById(\"logout\");t&&t.addEventListener(\"click\",()=>{fetch(\"/api/logout\",{method:\"POST\"}).then(o=>{if(!o.ok)throw new Error(\"Not OK!\");window.location.href=\"/\"}).catch(o=>{console.warn(\"Fetch logout failed\"),console.error(o)})});\n"}],"styles":[{"type":"external","src":"/_astro/about.Cv_qDB7B.css"},{"type":"external","src":"/_astro/about.CTWSK3Fg.css"}],"routeData":{"route":"/prompt-library/instructions/add","isIndex":false,"type":"page","pattern":"^\\/prompt-library\\/instructions\\/add\\/?$","segments":[[{"content":"prompt-library","dynamic":false,"spread":false}],[{"content":"instructions","dynamic":false,"spread":false}],[{"content":"add","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/prompt-library/instructions/add.astro","pathname":"/prompt-library/instructions/add","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"inline","value":"const t=document.getElementById(\"logout\");t&&t.addEventListener(\"click\",()=>{fetch(\"/api/logout\",{method:\"POST\"}).then(o=>{if(!o.ok)throw new Error(\"Not OK!\");window.location.href=\"/\"}).catch(o=>{console.warn(\"Fetch logout failed\"),console.error(o)})});\n"}],"styles":[{"type":"external","src":"/_astro/about.Cv_qDB7B.css"},{"type":"external","src":"/_astro/about.CTWSK3Fg.css"}],"routeData":{"route":"/prompt-library/instructions/[id]","isIndex":false,"type":"page","pattern":"^\\/prompt-library\\/instructions\\/([^/]+?)\\/?$","segments":[[{"content":"prompt-library","dynamic":false,"spread":false}],[{"content":"instructions","dynamic":false,"spread":false}],[{"content":"id","dynamic":true,"spread":false}]],"params":["id"],"component":"src/pages/prompt-library/instructions/[id].astro","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"inline","value":"const t=document.getElementById(\"logout\");t&&t.addEventListener(\"click\",()=>{fetch(\"/api/logout\",{method:\"POST\"}).then(o=>{if(!o.ok)throw new Error(\"Not OK!\");window.location.href=\"/\"}).catch(o=>{console.warn(\"Fetch logout failed\"),console.error(o)})});\n"}],"styles":[{"type":"external","src":"/_astro/about.Cv_qDB7B.css"},{"type":"external","src":"/_astro/about.CTWSK3Fg.css"}],"routeData":{"route":"/prompt-library/instructions","isIndex":true,"type":"page","pattern":"^\\/prompt-library\\/instructions\\/?$","segments":[[{"content":"prompt-library","dynamic":false,"spread":false}],[{"content":"instructions","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/prompt-library/instructions/index.astro","pathname":"/prompt-library/instructions","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"inline","value":"const t=document.getElementById(\"logout\");t&&t.addEventListener(\"click\",()=>{fetch(\"/api/logout\",{method:\"POST\"}).then(o=>{if(!o.ok)throw new Error(\"Not OK!\");window.location.href=\"/\"}).catch(o=>{console.warn(\"Fetch logout failed\"),console.error(o)})});\n"}],"styles":[{"type":"external","src":"/_astro/about.Cv_qDB7B.css"},{"type":"external","src":"/_astro/about.CTWSK3Fg.css"}],"routeData":{"route":"/prompt-library/knowledge-base/add","isIndex":false,"type":"page","pattern":"^\\/prompt-library\\/knowledge-base\\/add\\/?$","segments":[[{"content":"prompt-library","dynamic":false,"spread":false}],[{"content":"knowledge-base","dynamic":false,"spread":false}],[{"content":"add","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/prompt-library/knowledge-base/add.astro","pathname":"/prompt-library/knowledge-base/add","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"inline","value":"const t=document.getElementById(\"logout\");t&&t.addEventListener(\"click\",()=>{fetch(\"/api/logout\",{method:\"POST\"}).then(o=>{if(!o.ok)throw new Error(\"Not OK!\");window.location.href=\"/\"}).catch(o=>{console.warn(\"Fetch logout failed\"),console.error(o)})});\n"}],"styles":[{"type":"external","src":"/_astro/about.Cv_qDB7B.css"},{"type":"external","src":"/_astro/about.CTWSK3Fg.css"}],"routeData":{"route":"/prompt-library/knowledge-base/[id]","isIndex":false,"type":"page","pattern":"^\\/prompt-library\\/knowledge-base\\/([^/]+?)\\/?$","segments":[[{"content":"prompt-library","dynamic":false,"spread":false}],[{"content":"knowledge-base","dynamic":false,"spread":false}],[{"content":"id","dynamic":true,"spread":false}]],"params":["id"],"component":"src/pages/prompt-library/knowledge-base/[id].astro","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"inline","value":"const t=document.getElementById(\"logout\");t&&t.addEventListener(\"click\",()=>{fetch(\"/api/logout\",{method:\"POST\"}).then(o=>{if(!o.ok)throw new Error(\"Not OK!\");window.location.href=\"/\"}).catch(o=>{console.warn(\"Fetch logout failed\"),console.error(o)})});\n"}],"styles":[{"type":"external","src":"/_astro/about.Cv_qDB7B.css"},{"type":"external","src":"/_astro/about.CTWSK3Fg.css"}],"routeData":{"route":"/prompt-library/knowledge-base","isIndex":true,"type":"page","pattern":"^\\/prompt-library\\/knowledge-base\\/?$","segments":[[{"content":"prompt-library","dynamic":false,"spread":false}],[{"content":"knowledge-base","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/prompt-library/knowledge-base/index.astro","pathname":"/prompt-library/knowledge-base","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"inline","value":"const t=document.getElementById(\"logout\");t&&t.addEventListener(\"click\",()=>{fetch(\"/api/logout\",{method:\"POST\"}).then(o=>{if(!o.ok)throw new Error(\"Not OK!\");window.location.href=\"/\"}).catch(o=>{console.warn(\"Fetch logout failed\"),console.error(o)})});\n"}],"styles":[{"type":"external","src":"/_astro/about.Cv_qDB7B.css"},{"type":"external","src":"/_astro/about.CTWSK3Fg.css"}],"routeData":{"route":"/prompt-library/prompts/add","isIndex":false,"type":"page","pattern":"^\\/prompt-library\\/prompts\\/add\\/?$","segments":[[{"content":"prompt-library","dynamic":false,"spread":false}],[{"content":"prompts","dynamic":false,"spread":false}],[{"content":"add","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/prompt-library/prompts/add.astro","pathname":"/prompt-library/prompts/add","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"inline","value":"const t=document.getElementById(\"logout\");t&&t.addEventListener(\"click\",()=>{fetch(\"/api/logout\",{method:\"POST\"}).then(o=>{if(!o.ok)throw new Error(\"Not OK!\");window.location.href=\"/\"}).catch(o=>{console.warn(\"Fetch logout failed\"),console.error(o)})});\n"}],"styles":[{"type":"external","src":"/_astro/about.Cv_qDB7B.css"},{"type":"external","src":"/_astro/about.CTWSK3Fg.css"}],"routeData":{"route":"/prompt-library/prompts/[id]","isIndex":false,"type":"page","pattern":"^\\/prompt-library\\/prompts\\/([^/]+?)\\/?$","segments":[[{"content":"prompt-library","dynamic":false,"spread":false}],[{"content":"prompts","dynamic":false,"spread":false}],[{"content":"id","dynamic":true,"spread":false}]],"params":["id"],"component":"src/pages/prompt-library/prompts/[id].astro","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"inline","value":"const t=document.getElementById(\"logout\");t&&t.addEventListener(\"click\",()=>{fetch(\"/api/logout\",{method:\"POST\"}).then(o=>{if(!o.ok)throw new Error(\"Not OK!\");window.location.href=\"/\"}).catch(o=>{console.warn(\"Fetch logout failed\"),console.error(o)})});\n"}],"styles":[{"type":"external","src":"/_astro/about.Cv_qDB7B.css"},{"type":"external","src":"/_astro/about.CTWSK3Fg.css"}],"routeData":{"route":"/prompt-library/prompts","isIndex":true,"type":"page","pattern":"^\\/prompt-library\\/prompts\\/?$","segments":[[{"content":"prompt-library","dynamic":false,"spread":false}],[{"content":"prompts","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/prompt-library/prompts/index.astro","pathname":"/prompt-library/prompts","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"inline","value":"const t=document.getElementById(\"logout\");t&&t.addEventListener(\"click\",()=>{fetch(\"/api/logout\",{method:\"POST\"}).then(o=>{if(!o.ok)throw new Error(\"Not OK!\");window.location.href=\"/\"}).catch(o=>{console.warn(\"Fetch logout failed\"),console.error(o)})});\n"}],"styles":[{"type":"external","src":"/_astro/about.Cv_qDB7B.css"},{"type":"external","src":"/_astro/about.CTWSK3Fg.css"}],"routeData":{"route":"/prompts/[category]/[group]","isIndex":false,"type":"page","pattern":"^\\/prompts\\/([^/]+?)\\/([^/]+?)\\/?$","segments":[[{"content":"prompts","dynamic":false,"spread":false}],[{"content":"category","dynamic":true,"spread":false}],[{"content":"group","dynamic":true,"spread":false}]],"params":["category","group"],"component":"src/pages/prompts/[category]/[group].astro","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"inline","value":"const t=document.getElementById(\"logout\");t&&t.addEventListener(\"click\",()=>{fetch(\"/api/logout\",{method:\"POST\"}).then(o=>{if(!o.ok)throw new Error(\"Not OK!\");window.location.href=\"/\"}).catch(o=>{console.warn(\"Fetch logout failed\"),console.error(o)})});\n"}],"styles":[{"type":"external","src":"/_astro/about.Cv_qDB7B.css"},{"type":"inline","content":"@keyframes astroFadeInOut{0%{opacity:1}to{opacity:0}}@keyframes astroFadeIn{0%{opacity:0}}@keyframes astroFadeOut{to{opacity:0}}@keyframes astroSlideFromRight{0%{transform:translate(100%)}}@keyframes astroSlideFromLeft{0%{transform:translate(-100%)}}@keyframes astroSlideToRight{to{transform:translate(100%)}}@keyframes astroSlideToLeft{to{transform:translate(-100%)}}@media (prefers-reduced-motion){::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation:none!important}[data-astro-transition-scope]{animation:none!important}}\n"},{"type":"external","src":"/_astro/about.CTWSK3Fg.css"}],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["/home/steven/work/ai-toolbox/src/pages/index.astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/index@_@astro",{"propagation":"in-tree","containsHead":false}],["\u0000@astrojs-ssr-virtual-entry",{"propagation":"in-tree","containsHead":false}],["/home/steven/work/ai-toolbox/src/pages/about.astro",{"propagation":"none","containsHead":true}],["/home/steven/work/ai-toolbox/src/pages/headlines/demo.astro",{"propagation":"none","containsHead":true}],["/home/steven/work/ai-toolbox/src/pages/headlines/index.astro",{"propagation":"none","containsHead":true}],["/home/steven/work/ai-toolbox/src/pages/prompt-library/categories/[id].astro",{"propagation":"none","containsHead":true}],["/home/steven/work/ai-toolbox/src/pages/prompt-library/categories/add.astro",{"propagation":"none","containsHead":true}],["/home/steven/work/ai-toolbox/src/pages/prompt-library/categories/index.astro",{"propagation":"none","containsHead":true}],["/home/steven/work/ai-toolbox/src/pages/prompt-library/instructions/[id].astro",{"propagation":"none","containsHead":true}],["/home/steven/work/ai-toolbox/src/pages/prompt-library/instructions/add.astro",{"propagation":"none","containsHead":true}],["/home/steven/work/ai-toolbox/src/pages/prompt-library/instructions/index.astro",{"propagation":"none","containsHead":true}],["/home/steven/work/ai-toolbox/src/pages/prompt-library/knowledge-base/[id].astro",{"propagation":"none","containsHead":true}],["/home/steven/work/ai-toolbox/src/pages/prompt-library/knowledge-base/add.astro",{"propagation":"none","containsHead":true}],["/home/steven/work/ai-toolbox/src/pages/prompt-library/knowledge-base/index.astro",{"propagation":"none","containsHead":true}],["/home/steven/work/ai-toolbox/src/pages/prompt-library/prompts/[id].astro",{"propagation":"none","containsHead":true}],["/home/steven/work/ai-toolbox/src/pages/prompt-library/prompts/add.astro",{"propagation":"none","containsHead":true}],["/home/steven/work/ai-toolbox/src/pages/prompt-library/prompts/index.astro",{"propagation":"none","containsHead":true}],["/home/steven/work/ai-toolbox/src/pages/prompts/[category]/[group].astro",{"propagation":"none","containsHead":true}],["/home/steven/work/ai-toolbox/src/pages/login/index.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var i=t=>{let e=async()=>{await(await t())()};\"requestIdleCallback\"in window?window.requestIdleCallback(e):setTimeout(e,200)};(self.Astro||(self.Astro={})).idle=i;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var s=(i,t)=>{let a=async()=>{await(await i())()};if(t.value){let e=matchMedia(t.value);e.matches?a():e.addEventListener(\"change\",a,{once:!0})}};(self.Astro||(self.Astro={})).media=s;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var l=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let a of e)if(a.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=l;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000astro-internal:middleware":"_astro-internal_middleware.mjs","\u0000@astro-page:node_modules/.pnpm/astro@4.14.3_@types+node@22.4.1_rollup@4.21.0_typescript@5.5.4/node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astro-page:src/pages/404@_@astro":"pages/404.astro.mjs","\u0000@astro-page:src/pages/about@_@astro":"pages/about.astro.mjs","\u0000@astro-page:src/pages/api/categories.json@_@ts":"pages/api/categories.json.astro.mjs","\u0000@astro-page:src/pages/api/headlines.json@_@ts":"pages/api/headlines.json.astro.mjs","\u0000@astro-page:src/pages/api/instructions.json@_@ts":"pages/api/instructions.json.astro.mjs","\u0000@astro-page:src/pages/api/knowledge-base.json@_@ts":"pages/api/knowledge-base.json.astro.mjs","\u0000@astro-page:src/pages/api/login@_@ts":"pages/api/login.astro.mjs","\u0000@astro-page:src/pages/api/logout@_@ts":"pages/api/logout.astro.mjs","\u0000@astro-page:src/pages/api/promptExecution.json@_@ts":"pages/api/promptexecution.json.astro.mjs","\u0000@astro-page:src/pages/api/prompts.json@_@ts":"pages/api/prompts.json.astro.mjs","\u0000@astro-page:src/pages/headlines/demo@_@astro":"pages/headlines/demo.astro.mjs","\u0000@astro-page:src/pages/headlines/index@_@astro":"pages/headlines.astro.mjs","\u0000@astro-page:src/pages/login/index@_@astro":"pages/login.astro.mjs","\u0000@astro-page:src/pages/prompt-library/categories/add@_@astro":"pages/prompt-library/categories/add.astro.mjs","\u0000@astro-page:src/pages/prompt-library/categories/[id]@_@astro":"pages/prompt-library/categories/_id_.astro.mjs","\u0000@astro-page:src/pages/prompt-library/categories/index@_@astro":"pages/prompt-library/categories.astro.mjs","\u0000@astro-page:src/pages/prompt-library/instructions/add@_@astro":"pages/prompt-library/instructions/add.astro.mjs","\u0000@astro-page:src/pages/prompt-library/instructions/[id]@_@astro":"pages/prompt-library/instructions/_id_.astro.mjs","\u0000@astro-page:src/pages/prompt-library/instructions/index@_@astro":"pages/prompt-library/instructions.astro.mjs","\u0000@astro-page:src/pages/prompt-library/knowledge-base/add@_@astro":"pages/prompt-library/knowledge-base/add.astro.mjs","\u0000@astro-page:src/pages/prompt-library/knowledge-base/[id]@_@astro":"pages/prompt-library/knowledge-base/_id_.astro.mjs","\u0000@astro-page:src/pages/prompt-library/knowledge-base/index@_@astro":"pages/prompt-library/knowledge-base.astro.mjs","\u0000@astro-page:src/pages/prompt-library/prompts/add@_@astro":"pages/prompt-library/prompts/add.astro.mjs","\u0000@astro-page:src/pages/prompt-library/prompts/[id]@_@astro":"pages/prompt-library/prompts/_id_.astro.mjs","\u0000@astro-page:src/pages/prompt-library/prompts/index@_@astro":"pages/prompt-library/prompts.astro.mjs","\u0000@astro-page:src/pages/prompts/[category]/[group]@_@astro":"pages/prompts/_category_/_group_.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_BTtSMVX6.mjs","/astro/hoisted.js?q=0":"_astro/hoisted.BGLO5qHI.js","$components/InstructionCard.svelte":"_astro/InstructionCard.BjrTNSoI.js","@astrojs/svelte/client.js":"_astro/client.Cx1FBVJX.js","$pages/prompt-library/instructions/InstructionForm.svelte":"_astro/InstructionForm.Ch4jTB6H.js","$pages/prompt-library/knowledge-base/KnowledgeBaseForm.svelte":"_astro/KnowledgeBaseForm.BvkzcDVX.js","/astro/hoisted.js?q=1":"_astro/hoisted.BuPLPIA_.js","/home/steven/work/ai-toolbox/src/pages/headlines/HeadlineInputs.svelte":"_astro/HeadlineInputs.-fkcTS-8.js","$components/KnowledgeBaseCard.svelte":"_astro/KnowledgeBaseCard.CNlyKSWt.js","$components/ThemeSwitcher.svelte":"_astro/ThemeSwitcher.z0Wp-zep.js","$components/PromptCard.svelte":"_astro/PromptCard.CFtso_wS.js","$pages/prompt-library/categories/NewCategoryForm.svelte":"_astro/NewCategoryForm.DMN0Y8LJ.js","$components/CategoryCard.svelte":"_astro/CategoryCard.Cb075uy8.js","/home/steven/work/ai-toolbox/src/components/prompt-interface/components/PromptDetails.svelte":"_astro/PromptDetails.Bzmc4Dm0.js","$pages/prompt-library/prompts/PromptForm.svelte":"_astro/PromptForm.CqDTLv10.js","/home/steven/work/ai-toolbox/src/components/prompt-interface/components/PromptExecution.svelte":"_astro/PromptExecution.u22VtXLe.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/_astro/Avatar.CXMeRQjb.svg","/_astro/about.CTWSK3Fg.css","/_astro/about.Cv_qDB7B.css","/favicon.svg","/logo-somedia.svg","/soki-somedia.png","/img/aibox-login-background.svg","/_astro/CategoryCard.Cb075uy8.js","/_astro/HeadlineInputs.-fkcTS-8.js","/_astro/InputArea.BwaB7rQD.js","/_astro/InstructionCard.BjrTNSoI.js","/_astro/InstructionForm.Ch4jTB6H.js","/_astro/KnowledgeBaseCard.CNlyKSWt.js","/_astro/KnowledgeBaseForm.BvkzcDVX.js","/_astro/NewCategoryForm.DMN0Y8LJ.js","/_astro/PromptCard.CFtso_wS.js","/_astro/PromptDetails.Bzmc4Dm0.js","/_astro/PromptExecution.u22VtXLe.js","/_astro/PromptForm.CqDTLv10.js","/_astro/Stores.CXoTa1Mb.js","/_astro/ThemeSwitcher.z0Wp-zep.js","/_astro/client.Cx1FBVJX.js","/_astro/each.DBWXa8MQ.js","/_astro/index.DvT2uOMm.js","/_astro/index.hI-3bNKG.js","/_astro/utils.aMc-P89O.js"],"i18n":{"strategy":"manual","locales":["en",{"path":"de","codes":["de","de-DE","de-CH","de-DE","de-AT","de-LI","de-LU"]}],"defaultLocale":"en","domainLookupTable":{}},"buildFormat":"directory","checkOrigin":false,"serverIslandNameMap":[],"key":"B9g5m8KP6kuvxsgUj+UCfqhx+HovzgRsETsUHZSgVl0=","experimentalEnvGetSecretEnabled":false});

export { manifest };
