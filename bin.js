#! /usr/bin/env node
import split from "split2";
import pinoColada from "./index";
var input = process.stdin;
var output = process.stdout;

input.pipe(split(pinoColada())).pipe(output);
