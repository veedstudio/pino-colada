import prettyBytes from "prettier-bytes";
import jsonParse from "fast-json-parse";
import prettyMs from "pretty-ms";
import chalk from "chalk";
var nl = "\n";

var emojiLog = {
  warn: "⚠️",
  info: "✨",
  error: "🚨",
  debug: "🐛",
  fatal: "💀",
  trace: "🔍",
};

function isWideEmoji(character) {
  return character !== "⚠️";
}

function isObject(input) {
  return Object.prototype.toString.apply(input) === "[object Object]";
}

function isPinoLog(log) {
  return log && Object.prototype.hasOwnProperty.call(log, "level");
}

function PinoColada() {
  return parse;

  function parse(inputData) {
    var obj;
    if (typeof inputData === "string") {
      var parsedData = jsonParse(inputData);
      if (!parsedData.value || parsedData.err || !isPinoLog(parsedData.value)) {
        return inputData + nl;
      }
      obj = parsedData.value;
    } else if (isObject(inputData) && isPinoLog(inputData)) {
      obj = inputData;
    } else {
      return inputData + nl;
    }

    if (!obj.level) return inputData + nl;
    if (!obj.message) obj.message = obj.msg;
    if (typeof obj.level === "number") convertLogNumber(obj);

    return output(obj) + nl;
  }

  function convertLogNumber(obj) {
    if (obj.level === 10) obj.level = "trace";
    if (obj.level === 20) obj.level = "debug";
    if (obj.level === 30) obj.level = "info";
    if (obj.level === 40) obj.level = "warn";
    if (obj.level === 50) obj.level = "error";
    if (obj.level === 60) obj.level = "fatal";
  }

  function output(obj) {
    var {
      level,
      name,
      service,
      ns,
      res,
      req,
      statusCode,
      httpRequest,
      reqId,
      responseTime,
      elapsed,
      method,
      contentLength,
      responseBody,
      url,
      message,
      time,
      pid,
      hostname,
      severity,
      err,
      ...remainder
    } = obj;
    var output = [];

    if (!obj.level) obj.level = "userlvl";
    if (!obj.name) obj.name = "";
    if (!obj.ns) obj.ns = "";

    output.push(formatDate(obj.time || Date.now()));
    output.push(formatLevel(obj.level));
    output.push(formatNs(obj.ns));
    output.push(formatName(obj.name));
    output.push(formatMessage(obj));

    statusCode = res ? res.statusCode : obj.statusCode;
    responseTime = obj.responseTime || obj.elapsed;
    method = req ? req.method : obj.method;
    contentLength = obj.contentLength;
    url = req ? req.url : obj.url;
    var stack =
      obj.level === "fatal" || obj.level === "error"
        ? obj.stack || (err && err.stack)
        : null;
    // Output err if it has more keys than 'stack'
    err =
      (obj.level === "fatal" || obj.level === "error") &&
      err &&
      Object.keys(err).find((key) => key !== "stack")
        ? err
        : null;

    if (!contentLength && responseBody) {
      contentLength = formatRemainder(responseBody).length;
    }

    if (method != null) {
      output.push(formatMethod(method));
      output.push(formatStatusCode(statusCode));
    }
    if (url != null) output.push(formatUrl(url));
    if (contentLength != null) output.push(formatBundleSize(contentLength));

    if (responseTime != null) output.push(formatLoadTime(responseTime));
    if (stack != null) output.push(formatStack(stack));
    if (err != null) output.push(formatErrorProp(err));
    if (remainder != null) output.push(formatRemainder(remainder));

    return output.filter(noEmpty).join(" ");
  }

  function formatRemainder(remainder) {
    if (Object.keys(remainder).length === 0) return "";
    return JSON.stringify(remainder, null, 2).replaceAll("\n", "");
  }

  function formatDate(instant) {
    var date = new Date(instant);
    var hours = date.getHours().toString().padStart(2, "0");
    var minutes = date.getMinutes().toString().padStart(2, "0");
    var seconds = date.getSeconds().toString().padStart(2, "0");
    var prettyDate = hours + ":" + minutes + ":" + seconds;
    return chalk.gray(prettyDate);
  }

  function formatLevel(level) {
    const emoji = emojiLog[level];
    const padding = isWideEmoji(emoji) ? "" : " ";
    return emoji + padding;
  }

  function formatNs(name) {
    return chalk.cyan(name);
  }

  function formatName(name) {
    return chalk.blue(name);
  }

  function formatMessage(obj) {
    var msg = formatMessageName(obj.message);
    var pretty;
    if (obj.level === "error") pretty = chalk.red(msg);
    if (obj.level === "trace") pretty = chalk.white(msg);
    if (obj.level === "warn") pretty = chalk.magenta(msg);
    if (obj.level === "debug") pretty = chalk.yellow(msg);
    if (obj.level === "info" || obj.level === "userlvl")
      pretty = chalk.green(msg);
    if (obj.level === "fatal") pretty = chalk.white.bgRed(msg);
    return pretty;
  }

  function formatUrl(url) {
    return chalk.white(url);
  }

  function formatMethod(method) {
    return chalk.white(method);
  }

  function formatStatusCode(statusCode) {
    statusCode = statusCode || "xxx";
    return chalk.white(statusCode);
  }

  function formatLoadTime(elapsedTime) {
    var elapsed = parseInt(elapsedTime, 10);
    var time = prettyMs(elapsed);
    return chalk.gray(time);
  }

  function formatBundleSize(bundle) {
    var bytes = parseInt(bundle, 10);
    var size = prettyBytes(bytes).replace(/ /, "");
    return chalk.gray(size);
  }

  function formatMessageName(message) {
    if (message === "request" || message === "incoming request") return "<--";
    if (message === "response" || message === "request completed") return "-->";
    if (message === "response body") return "|-|";
    return message;
  }

  function formatStack(stack) {
    return stack ? nl + stack : "";
  }

  function formatErrorProp(errorPropValue) {
    return nl + JSON.stringify({ err: errorPropValue }, null, 2);
  }

  function noEmpty(val) {
    return !!val;
  }
}

export default PinoColada;
