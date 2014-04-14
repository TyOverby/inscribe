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
        "  blaag generate"

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

    var tokens = ['name', 'subName', 'author'];
    var def = { 'subName': ''};
    rlp(tokens, def).end(function (results) {
        fs.writeFileSync("blog.json", JSON.stringify(results, undefined, "    "));
        try{
            fs.mkdirSync("posts");
        } catch (e) {}
    });
}

function extractJsonFromMarkdown(str) {
    if (str.indexOf("---") != 0) {
        return [{}, str];
    }

    var closingIdx = str.slice(3).indexOf("---");
    var json = str.substring(3, closingIdx + 2);
    return [JSON.parse(json), str.substring(closingIdx + 8)];
}

function generate() {
    var contents = fs.readdirSync("posts");

    var files = contents.filter(function (fileName) {
        return fs.statSync("posts/" + fileName).isFile();
    });

    var contents = files.map(function (fileName) {
        return fs.readFileSync("posts/" + fileName, {encoding: 'utf8'});
    });

    var postsJson = contents.map(function (str) {
        var obj;
        var seperated = extractJsonFromMarkdown(str);
        obj = seperated[0];
        obj['_contents_'] = seperated[1];
        return obj;
    });

    var blogSettings = JSON.parse(fs.readFileSync("./blog.json"));
    blogSettings["_posts_"] = postsJson;
    fs.writeFileSync("./bundle.json", JSON.stringify(blogSettings, undefined, 4));
}

