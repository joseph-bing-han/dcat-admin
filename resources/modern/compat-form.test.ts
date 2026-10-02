// @ts-expect-error 兼容模块使用 jQuery 旧入口。
import $ from 'jquery';
// @ts-expect-error 生产 facade 保留 JavaScript 入口。
import { installFormSerialization } from './compat-form';

it('serializes only successful controls inside a step container', () => {
    document.body.innerHTML = '<div id="step"><input name="name" value="Alice"><input name="disabled" disabled value="skip"><input type="checkbox" name="choice" value="yes" checked><input type="checkbox" name="choice" value="no"><select name="tags" multiple><option selected value="a">A</option><option selected value="b">B</option></select><button name="submit">Submit</button></div><input name="outside" value="skip">';
    installFormSerialization($);
    expect(($('#step') as any).formToArray()).toEqual([
        { name: 'name', value: 'Alice' },
        { name: 'choice', value: 'yes' },
        { name: 'tags', value: 'a' },
        { name: 'tags', value: 'b' },
    ]);
    document.body.innerHTML = '';
});
