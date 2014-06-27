#!/usr/bin/env node

var fs = require('fs');
var rlp = require('readline-prompter');

main();
function main() {
    var args = process.argv.slice(2);

    switch (args[0]) {
        case 'init': init(args.slice(1)); break;
        case 'gen':
        case 'generate': generate(); break;
        default: printHelp(); break;
    }
}

function printHelp() {
    var msg =
        "Usage:\n" +
        "  blaag init\n" +
        "  blaag generate";

    console.log(msg);
}

function init(args) {
    if (args[0]) {
        fs.mkdirSync(args[0]);
        process.chdir(args[0]);
    }

    if (fs.existsSync("./blog.json")) {
        console.error("Can not create blog.json: File already exists");
        process.exit(1);
    }

    var tokens = ['name', 'subName', 'author', '_outDir_', '_postsDir_'];
    var def = { 'subName': '', '_outDir_': './blog/', '_postsDir_': './posts/'};
    rlp(tokens, def).end(function (results) {
        fs.writeFileSync("blog.json", JSON.stringify(results, undefined, "    "));
        try{
            fs.mkdirSync(results._postsDir_);
            fs.mkdirSync(results._outDir_);
        } catch (e) {}
    });
}

function extractJsonFromMarkdown(str) {
    if (str.indexOf("---") !== 0) {
        return [{}, str];
    }

    var closingIdx = str.slice(3).indexOf("---");
    if (closingIdx < 0) {
        // TODO: Handle error
    }
    var config = str.substring(3, closingIdx + 2);
    var configMap = {};
    var configSplit = config.split("\n");
    for(var i = 0; i < configSplit.length; i++) {
        var line = configSplit[i];
        if (line.trim().length === 0) {
            continue;
        }
        var semiPos = line.indexOf(":");
        if (semiPos <0) {
            // TODO: Handle error
        }
        configMap[line.slice(0, semiPos).trim()] = line.slice(semiPos + 1).trim();
    }

    return [configMap, str.substring(closingIdx + 7)];
}

function generate() {
    var postNames = fs.readdirSync("posts");

    var files = postNames.filter(function (fileName) {
        return fs.statSync("posts/" + fileName).isFile();
    });

    var contents = files.map(function (fileName) {
        return {
            name: fileName,
            str: fs.readFileSync("posts/" + fileName, {encoding: 'utf8'})
        };
    });

    var postsJson = contents.map(function (content) {
        var str = content.str;
        var obj;
        var seperated = extractJsonFromMarkdown(str);
        obj = seperated[0];
        obj['_file_'] = content.name;
        obj['_contents_'] = seperated[1];
        return obj;
    });

    var blogSettings = JSON.parse(fs.readFileSync("./blog.json"));
    blogSettings["_posts_"] = postsJson;
    fs.writeFileSync("./bundle.json", JSON.stringify(blogSettings, undefined, 4));
}

