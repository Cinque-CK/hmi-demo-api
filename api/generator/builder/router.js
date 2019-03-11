const path = require('path')
const shell = require('shelljs')
const S = require('string')

/**
 * Given the project's content definition, copies the router file template,
 * and replaces the placeholders with the information of the project's pages.
 * @constructor
 *
 * @param {object} content : Definition of the project to be generated
 * @param {string} targetDir : Folder to host the generated project for the given content
 */
async function _routerBuilder(content, targetDir) {
    const templateFile = path.resolve(targetDir, 'templates', 'router', 'index.js')
    const targetFile = path.resolve(targetDir, 'src', 'router', 'index.js')

    try {
        await shell.cp(templateFile, targetFile)
    } catch (e) {
        log.error('\n > Could not copy ' + targetFile);
    }

    let imports = ""
    let declarations = ""

    // Modified by chenzhe start
    // for (const page of content.pages) {
    //   const pageName = S(page.name).stripPunctuation().camelize().titleCase().s
    //
    //   imports += "\nimport " + pageName + " from '@/pages/" + pageName + "'"
    //
    //   declarations += "\n" + S(' ').times(4).s
    //     + "{ path: '" + page.id
    //     + "', name: '" + page.id
    //     + "', component: " + pageName + " },"
    // }
    let pages = JSON.parse(JSON.stringify(content.pages))
    let newTree = []
    setNewTree(pages, newTree, function (node, deep) {
        let pageId = node.id
        imports += "\nimport " + pageId + " from '@/pages/" + pageId + "'"
    }, 'subPages', 0)
    declarations = JSON.stringify(newTree)
    declarations = declarations.substr(1, declarations.length - 2)
    declarations = S(declarations).replaceAll('"@','').replaceAll('@"','').s
    // Modified by chenzhe end

    shell.sed('-i', '{{PAGES_IMPORTS}}', imports, targetFile)
    shell.sed('-i', '{{ROUTES_DECLARATIONS}}', declarations, targetFile)
}

var setNewTree = function (jsontree, newTree, callback, childrenProp, deep = 0) {
    if ((typeof jsontree == 'object') && (jsontree.constructor == Object.prototype.constructor)) {
        var arrey = [];
        arrey.push(jsontree);
    } else arrey = jsontree;
    for (var i = 0; i < arrey.length; i++) {
        var jn = arrey[i];
        // 找到节点,执行相应代码
        if (callback) callback(jn, deep)
        newTree.push({
            name: jn.id,
            path: `${deep === 0 ? '/' : ''}${jn.id}`,
            component: `@${jn.id}@`
        });
        // 遍历节点,执行相应代码
        if (jn[childrenProp] && jn[childrenProp].length > 0) {
            newTree[i].children = [];
            setNewTree(jn[childrenProp], newTree[i].children, callback, childrenProp, deep + 1);
        }
    }
};
module.exports = _routerBuilder
