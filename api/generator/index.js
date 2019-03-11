const path = require('path')
const ora = require('ora')

const prepare = require('./environment/prepare')
const vueBuilder = require('./builder/vue')
const routerBuilder = require('./builder/router')
const projetRefactor = require('./project/refactor')
const projetZip = require('./project/archive')
const cleanup = require('./environment/cleanup')

/**
 * Index of the project generator libraries.
 * @constructor
 *
 * @param {object} content : Definition of the project to be generated
 * @param {string} rootDir : The root folder of vuegg-server
 */
async function _generator (content, rootDir) {
  const spinner = ora({spinner: 'circleHalves'})
  let targetDir = path.resolve(rootDir, 'tmp', content.id)
  let zippedProject = path.resolve(rootDir, 'tmp', content.id + '.zip')

  try {
    spinner.start('> Getting environment ready')
    targetDir = await prepare(content, rootDir)
    spinner.succeed()
  } catch (e) {
    spinner.fail('> Oh! Shit went wrong during the preparations...\n' + e)
    process.exit(1)
  }

  console.log('> Scaffold located at -> ' + targetDir)

  try {
    spinner.start('> Building pages/components (' + content.title + ')')
    // Modified by chenzhe start
    // for (const page of content.pages) {
    //   await vueBuilder(page, content.components, targetDir)
    // }
    eachTree(content.pages,async function (node,deep) {
        await vueBuilder(node, content.components, targetDir)
    },'subPages',0)
    // Modified by chenzhe end

    spinner.succeed()
  } catch (e) {
    spinner.fail('> Ups! Pages/components generation failed...\n' + e)
    process.exit(1)
  }

  try {
    spinner.start('> Configuring Router')
    await routerBuilder(content, targetDir)
    spinner.succeed()
  } catch (e) {
    spinner.fail('> Ups! Router generation failed...\n' + e)
    process.exit(1)
  }

  try {
    spinner.start('> Refactoring (' + content.title + ')')
    await projetRefactor(content, targetDir)
    spinner.succeed()
  } catch (e) {
    spinner.fail('> Ups! Somethig broke during the project refactor...\n' + e)
    process.exit(1)
  }

  try {
    spinner.start('> Archiving project')
    await projetZip(content, targetDir)
    spinner.succeed()
  } catch (e) {
    spinner.fail('> Ups! Somethig broke during the zipping up...\n' + e)
    process.exit(1)
  }

  try {
    spinner.start('> Cleaning up the mess')
    await cleanup(targetDir)
    spinner.succeed()
  } catch (e) {
    spinner.fail('> Ups! Somethig broke during the cleanup...\n' + e)
    process.exit(1)
  }

  return zippedProject
}
/**
 * 递归法遍历树
 * @param jsontree 树数据
 * @param callback 遍历到每个节点要执行的回调方法
 * @param deep 每个节点的深度值
 */
var eachTree = function (jsontree, callback, prop, deep = 0) {
  if ((typeof jsontree == 'object') && (jsontree.constructor == Object.prototype.constructor)) {
    var arrey = [];
    arrey.push(jsontree);
  } else arrey = jsontree;
  for (var i = 0; i < arrey.length; i++) {
    var jn = arrey[i];
    // 找到节点,执行相应代码
    if (callback) callback(jn, deep);
    // 遍历节点,执行相应代码
    if (jn[prop] && jn[prop].length > 0) {
      eachTree(jn[prop], callback, prop, deep + 1);
    }
  }
};
module.exports = _generator
