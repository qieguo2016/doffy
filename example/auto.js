/**
 * @authors     : qieguo
 * @date        : 2017/5/12
 * @description :
 */

import Doffy from '../src/doffy';

const doffy = new Doffy();

(async() => {
  await doffy.init();
  await doffy.goto('https://github.com/qieguo2016/doffy');
  await doffy.click('[title="Star qieguo2016/doffy"]');
  await doffy.screenshot('doffy.jpeg');
  await doffy.wait(1000);
  await doffy.goto('https://www.baidu.com');
  await doffy.fill('#kw', 'github');
  await doffy.click('#su');
  let hasResult = await doffy.visible('.result')
  hasResult && console.log('======== search success ========');
  await doffy.screenshot('temp/search.jpeg');
  await doffy.end(true);
})();

